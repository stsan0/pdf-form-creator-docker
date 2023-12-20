import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import * as pdfjs_viewer from './pdfjs-dist/build/pdf.mjs';
document.getElementById("loadPdfBtn").addEventListener("click", loadPdf)
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues)
document.getElementById("editFormBtn").addEventListener("click", editForm)

let pdfDoc = null;
let canvas = document.getElementById('canvas');
let lastDrag = null;
pdfjs_viewer.GlobalWorkerOptions.workerSrc = './pdfjs-dist/build/pdf.worker.min.mjs';

async function loadPdf() {
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    // Add an iframe inside pdf-container for PDF to render onto, under canvas as a layer below
    const iframe = document.getElementById('pdfframe');

    if (file) {
        const data = await file.arrayBuffer();
        pdfDoc = await PDFDocument.load(data);
        const loadingTask = pdfjs_viewer.getDocument(data);
        loadingTask.promise.then(function (pdf) {
            console.log('PDF loaded');

            // Fetch the first page
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function (page) {
                console.log('Page loaded');

                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                var canvas = document.getElementById('pdfframe');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log('Page rendered');
                });
            });
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
        /*const pdfBytes = await pdfDoc.save();
        const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
        
        iframe.src = (pdfDataUri + "#toolbar=0");
        */
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
        const constructor = field.getName()
        const type = form.getTextfield(constructor)
        const name = type.getText()
        result[type] = name;
    })
    //console.log(result + " has the entries of " + Object.entries(result)); 
    // 
    return result;
}

function renderPdf() {
    // TODO: CORRECT THE OFFSET
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    // make  canvas the same size as the pdfframe
    let canvas = document.getElementById('canvas');
    canvas.width = pdfframe.width;
    canvas.height = pdfframe.height;
    // add editable-fields on top of pdf
    fields.forEach(field => {
        // if textfield then create editable-field
        if (field.constructor.name == "PDFTextField2") {
            //const type = field.constructor.name
            const name = field.getName()
            const textField = form.getTextField(name)
            const inner = textField.getText()
            const widgets = field.acroField.getWidgets();
            //widgets.forEach((w) => {
            //    const rect = w.getRectangle(); //{ x, y, width, height } This takes all four points that make up the rectangle.
            //});
            const rect = widgets[0].getRectangle(); //{ x, y, width, height } We're just using the top left corner.
            //console.log( "renderPdf: " + rect.x + " " + rect.y + " " + type + " " + name + " " + inner)
            const promise = createEditableField(rect.x, rect.y, name, inner, rect.width, rect.height).then(function (editableField) {
                canvas.appendChild(editableField);
            });
        }
    });
}

// Create editable field
async function createEditableField(x, y, className, inner, width, height) {
    const fieldText = document.createElement('div');
    // offset the field by the x and y values of the iframe to get the correct position
    fieldText.style.left = x + 150 + 'px';
    fieldText.style.bottom = y + 350 + 'px';
    //field.style.width = width + 'px';
    //field.style.height = height + 'px';
    //if (inner = 'undefined') {
    //    inner = ' ';
    //}
    if (inner == 'undefined' || inner == null) {
        inner = ' ';
    }
    fieldText.innerText = inner;
    fieldText.text = inner;
    // change div id to name
    if (className == 'editable-field' || !className) {
        fieldText.id = prompt("Prior name is " + className + ". Please enter a name for the field", console.log(fieldText.id));
    } else {

        fieldText.id = className;
    }
    // turn width and height into strings, so we can check for "px"
    width = width.toString();
    height = height.toString();
    // If the width and height do not have "px" at the end, add it
    if (width.includes('px') != true) {
        width = width + 'px';
        fieldText.style.width = width;
    }
    else {
        fieldText.style.width = width;
    }
    if (!height.includes('px') != true) {
        height = height + 'px';
        fieldText.style.height = height;
    }
    else {
        fieldText.style.height = height;
    }



    fieldText.draggable = true;
    // use the html font size, font color, font style values to update the editable-field's font properties
    const fontSize = document.getElementById('fontSize').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const fontWeight = document.getElementById('fontWeight').value;
    updateTextFieldFontProperties(fieldText, fontSize, fontColor, fontStyle, fontFamily, fontWeight);
    //field.appendChild(fieldText);

    // Add event listener to capture changes to the name
    fieldText.addEventListener('click', function (event) {
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
    fieldText.addEventListener('dragstart', function (event) {
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

    fieldText.appendChild(tag);
    return fieldText;
}

// Function to update the text field with user-defined font properties
function updateTextFieldFontProperties(textField, fontSize, fontColor, fontStyle, fontFamily, fontWeight) {
    // get the text field from the toolbox and update its font properties
    console.log("updateTextFieldFontProperties: " + fontSize + " " + fontColor + " " + fontStyle + " " + fontFamily)
    textField.style.fontSize = (fontSize + "px");
    textField.style.color = fontColor;
    textField.style.fontFamily = fontFamily;
    textField.style.fontStyle = fontStyle;
    textField.style.fontWeight = fontWeight;
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

        if (event.target.parentElement == 'canvas') {

            event.target.remove();
        }
        event.dataTransfer.setData('text/plain', toolboxField.dataset.fieldName);
    });
});

// Add event listener for canvas drop
canvas.addEventListener('drop', function (event) {
    event.preventDefault();
    let className = lastDrag.id;
    console.log("dropping : " + className)
    const offsetX = event.clientX - startX; //- canvas.getBoundingClientRect().left;
    const offsetY = event.clientY - startY; //- canvas.getBoundingClientRect().top;
    const fieldName = lastDrag.text;
    if (lastDrag.parentElement == 'canvas') {
        lastDrag.style.left = offsetX + 'px';
        lastDrag.style.top = offsetY + 'px';
    } else {
        const editableField = createEditableField(offsetX, offsetY, className, fieldName, lastDrag.style.width, lastDrag.style.height).then(function (editableField) {
            canvas.appendChild(editableField);
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

