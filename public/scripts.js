import { PDFDocument, PDFName, PDFRef } from 'https://cdn.skypack.dev/pdf-lib';
import * as pdfjs_viewer from './pdfjs-dist/build/pdf.mjs';
import extractText from './extract_text.js';
import createEditableField from './createEditableField.js';

document.getElementById("loadPdfBtn").addEventListener("click", loadPdf)
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues)
document.getElementById("editFormBtn").addEventListener("click", editForm)
document.getElementById("displayFieldsBtn").addEventListener("click", displayFields)

let pdfDoc = null;
let canvas = document.getElementById('canvas');
pdfjs_viewer.GlobalWorkerOptions.workerSrc = './pdfjs-dist/build/pdf.worker.min.mjs';
const scale = 2;
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
                //console.log(page)
                //console.log(page.view)

                var viewport = page.getViewport({ scale: scale });
                //console.log(viewport)
                // Prepare canvas using PDF page dimensions
                var pdfframe = document.getElementById('pdfframe');
                var context = pdfframe.getContext('2d');
                pdfframe.height = viewport.height;
                pdfframe.width = viewport.width;

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
        let fieldValues = extractText(pdfDoc).then(function (fieldValues) {
            //fieldsContainer.innerHTML = (fieldValues);
            for (const [key, value] of Object.entries(fieldValues)) {
                //console.log(`${key}: ${value}`);
                fieldsContainer.innerHTML += (`${key}: ${value}` + "<br>");
            }
        }
        );
    }
}
function renderPdf() {
    // TODO: CORRECT THE OFFSET OF ELEMENTS ON DROP
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    // make  canvas the same size as the pdfframe
    let canvas = document.getElementById('canvas');
    canvas.width = pdfframe.width;
    canvas.height = pdfframe.height;
    let i = 0;
    // add editable-fields on top of pdf
    fields.forEach(field => {
        // if textfield then create editable-field
        if (field.constructor.name == "PDFTextField2") {
            //const type = field.constructor.name
            let name = field.getName()
            const textField = form.getTextField(name)
            const inner = textField.getText()
            const widgets = field.acroField.getWidgets();
            //widgets.forEach((w) => {
            //    const rect = w.getRectangle(); //{ x, y, width, height } This takes all four points that make up the rectangle.
            //});
            const rect = widgets[0].getRectangle(); //{ x, y, width, height } We're just using the top left corner.
            //console.log( "renderPdf: " + rect.x + " " + rect.y + " " + type + " " + name + " " + inner)
            // check if field is already in canvas with a editable-field, check by data-field
            const editableFields = document.querySelectorAll('editable-field');
            console.log("checking if " + name + " already exists with " + editableFields.length + " editable-fields")
            let exists = false;
            editableFields.forEach(editableField => {
                if (editableField.getAttribute('data-field') == name) {
                    exists = true;
                }
            });
            if (exists) {
                // add a #i to the end of the name to make it unique
                name = name + "#" + i;
                console.log(name + " already exists, adding #" + i + " to the end")
                i++;
                const promise = createEditableField(rect.x, rect.y, name, inner, rect.width, rect.height, scale).then(function (editableField) {
                    canvas.appendChild(editableField);
                });
            }
            else {
                i = 0;
                const promise = createEditableField(rect.x, rect.y, name, inner, rect.width, rect.height, scale).then(function (editableField) {
                    canvas.appendChild(editableField);
                });

            }
        }
        else {
            console.log(field.getName + " constructor is " + field.constructor.name)
        }
    });
}



async function editForm() {
    if (!pdfDoc) return;
    // add editable-fields on top of pdf
    const editableFields = document.querySelectorAll('#editable-field');
    //for (let pageNum = 0; pageNum <= pdfDoc.getPageCount(); pageNum++) {
    const pageNum = 0;
    editableFields.forEach(editableField => {
        const fieldName = editableField.getAttribute('data-field');
        const target = editableField;
        // { x, y, width, height } 
        const x = parseInt(target.style.left) * (1 / scale);
        const y = parseInt(target.style.bottom) * (1 / scale);
        const width = parseInt(target.style.width);
        const height = parseInt(target.style.height);
        //const textColor = RGBToHex(target.style.color);
        //console.log(textColor);
        //console.log("how many pages?: " + pdfDoc.getPageCount())

        // Get the page object for the current page
        const page = pdfDoc.getPage(pageNum)
        const form = pdfDoc.getForm();

        const field = form.getFields().find(x => x.getName() === fieldName);
        console.log("removing " + field.getName() + "| original |" + fieldName);
        console.log(field);
        while (field.acroField.getWidgets().length) {
            field.acroField.removeWidget(0); // removes first widget
        }
        form.removeField(field);
        // use pdf-lib TextPosition to set properties
        const textPosition = {
            x: x,
            y: y,
            width: width,
            height: height,
            //textColor: textColor,
            //font: editableField.style.fontFamily,
        };
        // create the editable-field in the pdf
        console.log("creating new " + fieldName)
        const newTextField = form.createTextField(fieldName)
        newTextField.setText(editableField.text);
        newTextField.addToPage(page, textPosition)
    });
    //}
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

let pressed = false;
async function displayFields() {
    const editableFields = document.querySelectorAll('#editable-field');
    if (!pressed) {
        console.log("displaying fields");
        editableFields.forEach(editableField => {
            //console.log("displaying " + editableField.getAttribute('data-field'))
            // make each editablefield's background transparent
            editableField.style.backgroundColor = "transparent";
            // make an overlay div for each editable-field, which shows the data-field name. 
            // In the element structure, the overlay div is a sibling of the editable-field
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.height = editableField.style.height;
            overlay.style.backgroundColor = "black";
            overlay.style.color = "white";
            overlay.innerHTML = editableField.getAttribute('data-field');
            overlay.text = editableField.getAttribute('data-field');
            overlay.id = 'overlay';
            overlay.draggable = true;
            // add the overlay div as a child of the editable-field, so that it is on top of the editable-field
            editableField.prepend(overlay);
        });
    }
    else {
        editableFields.forEach(editableField => {
            // delete all overlays
            const overlays = document.querySelectorAll('#overlay');
            overlays.forEach(overlay => {
                overlay.remove();
            });

        });
    }

    pressed = !pressed;
}