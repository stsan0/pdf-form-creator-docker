import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
document.getElementById("loadPdfBtn").addEventListener("click", loadPdf)
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues)
document.getElementById("editFormBtn").addEventListener("click", editForm)

let pdfDoc = null;
let canvas = document.getElementById('canvas');
let pdfContainer = document.getElementById('pdf-container');
let lastDrag = null;

async function loadPdf() {
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    // Add an iframe inside pdf-container for PDF to render onto, under canvas as a layer below
    const iframe = document.getElementById('iframe');

    if (file) {
        const data = await file.arrayBuffer();
        pdfDoc = await PDFDocument.load(data);
        const pdfBytes = await pdfDoc.save();
        const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
        iframe.src = (pdfDataUri + "#toolbar=0");
        renderPdf();
    }
}

async function showFieldValues() {
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    if (file) {
        const fieldsContainer = document.getElementById('fields-container');
        let fieldValues = extractText().then(function (fieldValues) {
            //fieldsContainer.innerHTML = (fieldValues);
            fieldsContainer.innerHTML = JSON.stringify(fieldValues, null, 2);
        }
        );
    }
}

// get the fieldValues from a PDF form
async function extractText() {
    var result = {};
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    fields.forEach(field => {
        const type = field.constructor.name
        const name = field.getName()
        result[type] = name;
    })
    //console.log(result + " has the entries of " + Object.entries(result)); 
    // 
    return result;
}

function renderPdf() {
    const canvas = document.getElementById('canvas');

    // add editable-fields on top of pdf
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    fields.forEach(field => {
        // if textfield then create editable-field
        if (field.constructor.name == "PDFTextField2") {
            const type = field.constructor.name
            const name = field.getName()
            const textField = form.getTextField(name)
            const inner = textField.getText()
            const widgets = field.acroField.getWidgets();
            //widgets.forEach((w) => {
            //    const rect = w.getRectangle(); //{ x, y, width, height }
            //});
            const rect = widgets[0].getRectangle(); //{ x, y, width, height }
            //console.log( "renderPdf: " + rect.x + " " + rect.y + " " + type + " " + name + " " + inner)
            createEditableField(rect.x, rect.y, name, inner, rect.width, rect.height).then(function (editableField) {
                canvas.append(editableField);
            });
        }
    });
}

async function editForm() {
    if (!pdfDoc) return;
    // add editable-fields on top of pdf
    const editableFields = document.querySelectorAll('.editable-field');
    editableFields.forEach(editableField => {
        const fieldName = editableField.innerText;

        const target = editableField.getBoundingClientRect();
        //const { x, y, width, height } = {target.x, target.y, target.width, target.height};
        const x = target.x;
        const y = target.y;
        const width = target.width;
        const height = target.height;
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            // Get the page object for the current page
            pdfDoc.getPage(pageNum).then(page => {
                const field = page.getTextField(fieldName);
                if (field) {
                    field.removeFromPage();
                }
                pdfDoc.drawTextField(/*fieldName,*/{ x, y, width, height });
            });
            //field.updateAppearances();
            //editableField.remove();
        }
    });

    // save to pdf
    const modifiedPdfBytes = await pdfDoc.save();
    downloadPdf(modifiedPdfBytes, 'modified.pdf');
}

function downloadPdf(data, filename) {
    const blob = new Blob([data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
let startX = null;
let startY = null;

// Add event listener for toolbox field drag start
const toolboxFields = document.querySelectorAll('.toolbox-field');
toolboxFields.forEach(toolboxField => {
    toolboxField.addEventListener('dragstart', function (event) {
        const target = event.target.getBoundingClientRect();
        lastDrag = event.target;
        startX = event.clientX - target.x;
        startY = event.clientY - target.y;

        if (event.target.className == 'editable-field') {

            event.target.remove();
        }
        event.dataTransfer.setData('text/plain', toolboxField.dataset.fieldName);
    });
});

// Add event listener for canvas drop
canvas.addEventListener('drop', function (event) {
    event.preventDefault();
    const fieldName = event.dataTransfer.getData('text/plain');
    const offsetX = event.clientX - startX; //- canvas.getBoundingClientRect().left;
    const offsetY = event.clientY - startY; //- canvas.getBoundingClientRect().top;

    if (lastDrag.className == 'editable-field') {
        lastDrag.style.left = offsetX + 'px';
        lastDrag.style.top = offsetY + 'px';
    } else {
        const editableField = createEditableField(offsetX, offsetY, fieldName, '').then(function (editableField) {
            canvas.after(editableField);
        });
    }
});

// Prevent default behavior to allow drop
canvas.addEventListener('dragover', function (event) {
    event.preventDefault();
});
let dragging = false;
document.onmousemove = function (e) {
    if (!dragging) return;
}

// Create editable field
async function createEditableField(x, y, className, inner, width, height) {
    const field = document.createElement('div');
    const fieldText = document.createElement('div');
    if (className) {
        field.className = className;
    } else {
        field.className = 'editable-field';
    }
    field.style.position = 'fixed';
    // left + offset to account for the pdf-container's left offset
    field.style.left = iframe.getBoundingClientRect().left + x + 'px';
    field.style.bottom = iframe.getBoundingClientRect().bottom + y + 'px';
    field.style.width = width + 'px';
    field.style.height = height + 'px';
    fieldText.innerText = inner;
    fieldText.className = 'editable-field-box';
    field.draggable = true;
    field.style.width = '100px';
    // use the html font size, font color, font style values to update the editable-field's font properties
    const fontSize = document.getElementById('fontSize').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const fontFamily = document.getElementById('fontFamily').value;
    updateTextFieldFontProperties(fieldText, fontSize, fontColor, fontStyle, fontFamily);
    field.appendChild(fieldText);

    // Add event listener to capture changes to the name
    field.addEventListener('click', function (event) {
        let o = '100px';
        if (event.target.hasAttribute('data-width')) {
            o = event.target.getAttribute('data-width');
        }
        console.log('...' + event.target.style.width, o);
        if (event.target.style.width != o) {
            event.target.setAttribute('data-width', event.target.style.width);

            console.log('width changed to ' + event.target.style.width);
            return;
        }
        const newName = prompt('Enter a new name:', field.innerText);
        if (newName !== null) {
            field.innerText = newName;
            console.log('Updated name:', newName);

            // You can send this newName to the server for further processing
        }
    })
    field.addEventListener('dragstart', function (event) {
        //const target = event.target.getBoundingClientRect();
        //startX = event.clientX - target.x;
        //startY = event.clientY - target.y;
        //event.target.remove();
        dragging = true;
        lastDrag = event.target;
    });

    const tag = document.createElement('span');
    tag.className = "font-control fa fa-edit";
    tag.innerHTML = "";

    tag.addEventListener('click', function (e) {
        efb = e.target.parentElement.querySelector('.editable-field-box');
        openModal(document.getElementById('fontControls').innerHTML, 'Editing ' + efb.innerText);
        let mmodal = document.querySelector('.modal-body');
        mmodal.querySelector('#fontSize').value = efb.style.fontSize.replace('px', '');
        //console.log(efb.style.fontFamily);
        mmodal.querySelector('#fontColor').value = RGBToHex(efb.style.color);
        mmodal.querySelector('#fontFamily').value = efb.style.fontFamily.replace(/"/g, '');
        mmodal.querySelector('#fontStyle').value = efb.style.fontStyle;
        mmodal.querySelector('#fontWeight').value = efb.style.fontWeight;

    });

    field.appendChild(tag);
    return field;
}

// Function to update the text field with user-defined font properties
function updateTextFieldFontProperties(textField, fontSize, fontColor, fontStyle, fontFamily) {
    // get the text field from the toolbox and update its font properties
    console.log("updateTextFieldFontProperties: " + fontSize + " " + fontColor + " " + fontStyle + " " + fontFamily)
    textField.style.fontSize = (fontSize + "px");
    textField.style.color = fontColor;
    textField.style.fontFamily = fontFamily;
    textField.style.fontStyle = fontStyle;
}




