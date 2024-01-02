import { PDFDocument, PDFName, PDFRef } from 'https://cdn.skypack.dev/pdf-lib';
import * as pdfjs_viewer from './pdfjs-dist/build/pdf.mjs';
import extractText from './extract_text.js';
import createEditableField from './createEditableField.js';

document.getElementById("loadPdfBtn").addEventListener("click", loadPdf)
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues)
document.getElementById("editFormBtn").addEventListener("click", editForm)
document.getElementById("displayFieldsBtn").addEventListener("click", displayFields)

let pdfDoc = null;
pdfjs_viewer.GlobalWorkerOptions.workerSrc = './pdfjs-dist/build/pdf.worker.min.mjs';
const scale = 2;
async function loadPdf() {
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    if (file) {
        const data = await file.arrayBuffer();
        pdfDoc = await PDFDocument.load(data);
        const loadingTask = pdfjs_viewer.getDocument(data);
        loadingTask.promise.then(function (pdf) {
            console.log('PDF loaded');
            // TODO: make this a loop to fetch all pages and render them with their page-specific fields
            for (let pageNumber = 0; pageNumber < pdf.numPages; pageNumber++) {
                pdf.getPage(pageNumber + 1).then(function (page) {
                    console.log('Page loaded');
                    var viewport = page.getViewport({ scale: scale });
                    var pdfframe = document.getElementById('pdfframe');
                    var context = pdfframe.getContext('2d');
                    pdfframe.height = viewport.height;
                    pdfframe.width = viewport.width;

                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    var renderTask = page.render(renderContext);
                    renderTask.promise.then(function () {
                        console.log('Page rendered');
                        renderPdf(page);
                    });
                });
            }
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    }
}

async function renderPdf(page) {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    let canvas = document.getElementById('canvas');
    canvas.width = pdfframe.width;
    canvas.height = pdfframe.height;
    fields.forEach(field => {
        createEF(field, form, canvas, page);
    });
}

function createEF(field, form, canvas, page) {
    let name = field.getName();
    const widgets = field.acroField.getWidgets();
    for (const widget of widgets) {
        const rect = widget.getRectangle();
        let value;
        if (field.constructor.name == "PDFTextField2") {
            const textField = form.getTextField(name);
            value = textField.getText();
        } else if (field.constructor.name == "PDFCheckBox2") {
            const checkBox = form.getCheckBox(name);
            value = checkBox.isChecked();
        } else if (field.constructor.name == "PDFRadioGroup2") {
            const radioButton = form.getRadioGroup(name);
            value = radioButton.getSelected();
        } else if (field.constructor.name == "PDFDropdown2") {
            const dropdown = form.getDropdown(name);
            value = dropdown.getSelected();
        } else if (field.constructor.name == "PDFListbox2") {
            const listbox = form.getListbox(name);
            value = listbox.getSelected();
        } else if (field.constructor.name == "PDFSignature2") {
            const signature = form.getSignature(name);
            value = signature.getContents();
        } else {
            console.log(field.getName + " constructor is " + field.constructor.name);
            return;
        }
        createEditableField(rect.x, rect.y, name, value, rect.width, rect.height, scale).then(function (editableField) {
            canvas.appendChild(editableField);
        });
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
        const width = parseInt(target.style.width) * (1 / scale);
        const height = parseInt(target.style.height) * (1 / scale);
        //const textColor = RGBToHex(target.style.color);
        //console.log(textColor);
        //console.log("how many pages?: " + pdfDoc.getPageCount())

        // Get the page object for the current page
        const page = pdfDoc.getPage(pageNum)
        const form = pdfDoc.getForm();

        const field = form.getFields().find(x => x.getName() === fieldName);
        console.log(field);
        if (field == undefined) {
            console.log("field is undefined because new field was created")
        }
        else {
            console.log("removing " + field.getName() + "| original |" + fieldName);
            while (field.acroField.getWidgets().length) {
                field.acroField.removeWidget(0); // removes first widget
            }
            form.removeField(field);
        }
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
        if (editableField.text == 'true' || editableField.text == 'false') {
            const newCheckBox = form.createCheckBox(fieldName)
            newCheckBox.addToPage(page, textPosition)
        }
        else {
            const newTextField = form.createTextField(fieldName)
            newTextField.setText(editableField.text);
            newTextField.addToPage(page, textPosition)
        }
    });
    //}
    // save to pdf
    const modifiedPdfBytes = await pdfDoc.save();
    downloadPdf(modifiedPdfBytes, pdfDoc.getTitle() + '_modified.pdf');
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