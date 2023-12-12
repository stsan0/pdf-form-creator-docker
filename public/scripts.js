//import { PDFDocument } from './pdf-lib/dist/pdf-lib.js';
//SyntaxError: Requested module does not provide an export named 'PDFDocument' 
//import { PDFDocument } from 'pdf-lib';
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

document.getElementById("loadPdfBtn").addEventListener("click", loadPdf)
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues)
document.getElementById("editFormBtn").addEventListener("click", editForm)

let pdfDoc = null;
let canvas = document.getElementById('canvas');
let lastDrag = null;

async function loadPdf() {
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    if (file) {
        const data = await file.arrayBuffer();
        //pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        pdfDoc = await PDFDocument.load(data);
        renderPdf();
    }
}

export async function showFieldValues() {
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

export function renderPdf() {
    const pdfContainer = document.getElementById('pdf-container');
    const form = pdfDoc.getForm();
    // Loop through each page of the PDF document
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(page => {
            // Separate fields from the Doc, then display the Doc
            const fields = form.getFields();
            // Loop through each field of the PDF form

            fields.forEach(field => {
                const type = field.constructor.name
                const name = field.getName()
                const inner = field.getValue()
                const widgets = field.acroField.getWidgets();
                //widgets.forEach((w) => {
                //    const rect = w.getRectangle(); //{ x, y, width, height }
                //});
                const rect = widgets[0].getRectangle(); //{ x, y, width, height }

                createEditableField(rect.x, rect.y, type, name, inner).then(function (editableField) {
                    canvas.after(editableField);
                });
            }
            );
            // Render the page!
            const canvas = document.createElement('canvas');
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext);
            pdfContainer.appendChild(canvas);
        });
    }
}

export async function editForm() {
    if (!pdfDoc) return;
    // add editable-fields on top of pdf
    const fieldsContainer = document.getElementById('fields-container');
    const editableFields = document.querySelectorAll('.editable-field');
    editableFields.forEach(editableField => {
        const fieldName = editableField.innerText;
        //const field = pdfDoc.getField(fieldName);
        const target = editableField.getBoundingClientRect();
        //const { x, y, width, height } = {target.x, target.y, target.width, target.height};
        const x = target.x;
        const y = target.y;
        const width = target.width;
        const height = target.height;
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = pdfDoc.getPage(pageNum);
            // Remove the previous form field/value (if any)
            const field = page.getTextField(fieldName);
            if (field) {
                field.removeFromPage();
            }
            // Change the formfield's value and appearance
            field = page.createTextField(fieldName);
            field.setText(editableField.innerText);
            field.addToPage(page, { x, y, width, height });

            //field.updateAppearances();
            //editableField.remove();
        }
    });

    // save to pdf
    const modifiedPdfBytes = await pdfDoc.save();
    downloadPdf(modifiedPdfBytes, 'modified.pdf');
}

export function downloadPdf(data, filename) {
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
        const editableField = createEditableField(offsetX, offsetY, fieldName, 'undefined').then(function (editableField) {
            canvas.after(editableField);
        });
    }
});

// Prevent default behavior to allow drop
canvas.addEventListener('dragover', function (event) {
    event.preventDefault();
});

// Create editable field
async function createEditableField(left, top, initialValue, inner) {
    const field = document.createElement('div');
    field.className = 'editable-field';
    field.style.left = left + 'px';
    field.style.top = top + 'px';
    if (inner != '') {
        field.innerText = inner;
    } else {
        field.innerText = 'undefined';
    }
    field.draggable = true;
    field.style.width = '100px';
    // use the html font size, font color, font style values to update the editable-field's font properties
    const fontSize = document.getElementById('fontSize').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const fontFamily = document.getElementById('fontFamily').value;
    updateTextFieldFontProperties(field, fontSize, fontColor, fontStyle, fontFamily);

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

        lastDrag = event.target;
    });
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




