import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import * as pdfjs_viewer from './pdfjs-dist/build/pdf.mjs';
import extractText from './extract_text.js';
import createEditableField from './createEditableField.js';
import displayFields from './displayFields.js';
import editForm from './saveForm.js';

let pageIndexDiv = document.getElementById("pageIndex");
let totalPageIndexDiv = document.getElementById("totalPageIndex");
let pageNumber = 0; // Initial pageNumber
let totalPages = 0;

let pdfDoc = null;
let pdfjsGlobal = null;
pdfjs_viewer.GlobalWorkerOptions.workerSrc = './pdfjs-dist/build/pdf.worker.min.mjs';
const scale = 2;
let form = null;
let fields = null;
let pageItself = null;
let pageIndex = null;

document.getElementById("loadPdfBtn").addEventListener("click", loadPdf);
document.getElementById("showValuesBtn").addEventListener("click", showFieldValues);
document.getElementById("editFormBtn").addEventListener("click", () => { editForm(pdfDoc) });
document.getElementById("displayFieldsBtn").addEventListener("click", displayFields);
document.getElementById("backBtn").addEventListener("click", backBtn);
document.getElementById("nextBtn").addEventListener("click", nextBtn);



async function loadPdf() {
    areYouSure(); // adds a pop up if canvas and pdf-container are not empty
    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files[0];
    if (file) {
        const data = await file.arrayBuffer();
        pdfDoc = await PDFDocument.load(data);
        const loadingTask = pdfjs_viewer.getDocument(data);
        loadingTask.promise.then(async function (pdf) {
            pdfjsGlobal = pdf; // sets global object for later use
            // display the pages of the PDF in canvas
            totalPages = pdfDoc.getPageCount();
            updatePageNumber()
            await pdf.getPage(pageNumber + 1).then(async function (page) {
                console.log('Page loaded');
                var viewport = page.getViewport({ scale: scale });
                var pdfframe = document.createElement('canvas');
                pdfframe.id = 'pdfframe';
                var context = pdfframe.getContext('2d');
                pdfframe.height = viewport.height;
                pdfframe.width = viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                var pdfContainer = document.getElementById('pdf-container');
                var firstChild = pdfContainer.firstChild; // Get the first child

                renderTask.promise.then(function () {
                    console.log('Page rendered');
                    pdfContainer.insertBefore(pdfframe, firstChild.nextSibling); // Insert the child after the first child
                    renderPdfFields(pageNumber); // add editable fields on top of pdf 
                });
            });
        });
        console.log('PDF loaded');
    }
}

function areYouSure() {
    // add a popup if canvas and pdf-container are not empty
    const canvas = document.getElementById('canvas');
    const pdfContainer = document.getElementById('pdf-container');
    if (canvas.firstChild || pdfContainer.childElementCount > 1) {
        if (confirm("Changes will be lost if you press OK and replace the current PDF. Press Cancel to keep the current PDF.")) {
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            for (let i = 0; i < pdfContainer.childElementCount; i++) {
                const pdfframe = document.getElementById('pdfframe-[' + i + ']');
                if (pdfframe != null) {
                    pdfContainer.removeChild(pdfframe);
                }
            }
            // reset pdfDoc
            pdfDoc = null;
            console.log("pdfDoc is " + pdfDoc)

        } else {
            throw new Error("Cancelled");
        }
    }
}

async function renderPdfFields(pageNumber) {
    if (form == null) {
        form = pdfDoc.getForm();
        fields = form.getFields();
    }
    fields.forEach(field => {
        const existingField = document.getElementById(field.getName());
        if (!existingField) {
            createEF(field, form, pageNumber);
        }
        else {
            console.log("field " + field.getName() + " already exists");
        }
    });
}

function backBtn() {
    if (pageNumber > 0) {
        pageNumber--;
        console.log("pageNumber: " + pageNumber)
        updatePageNumber();
        removeOldPage();
        updateToNewPage();
    }
}

function nextBtn() {
    if (pageNumber < totalPages - 1) {
        pageNumber++;
        console.log("pageNumber: " + pageNumber)
        updatePageNumber();
        removeOldPage();
        updateToNewPage();
    }
}


function updatePageNumber() {
    pageIndexDiv.textContent = pageNumber + 1; // Adding 1 to display the page number starting from 1
    totalPageIndexDiv.textContent = totalPages;
}

function removeOldPage() {
    const pdfframe = document.getElementById('pdfframe');
    pdfframe.remove();
    const editableFields = document.querySelectorAll('#editable-field');
    editableFields.forEach(editableField => {
        editableField.remove();
    });
}


async function updateToNewPage() {
    await pdfjsGlobal.getPage(pageNumber + 1).then(async function (page) {
        console.log('Page loaded');
        var viewport = page.getViewport({ scale: scale });
        var pdfframe = document.createElement('canvas');
        pdfframe.id = 'pdfframe';
        var context = pdfframe.getContext('2d');
        pdfframe.height = viewport.height;
        pdfframe.width = viewport.width;

        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        var renderTask = page.render(renderContext);
        var pdfContainer = document.getElementById('pdf-container');
        var firstChild = pdfContainer.firstChild; // Get the first child

        renderTask.promise.then(function () {
            console.log('Page rendered');
            pdfContainer.insertBefore(pdfframe, firstChild.nextSibling); // Insert the child after the first child
            renderPdfFields(pageNumber); // add editable fields on top of pdf 
        });
    });
    console.log('PDF loaded');
}

function createEF(field, form, pageNumber) {
    let name = field.getName();
    pageItself = null;
    pageIndex = null;
    const widgets = field.acroField.getWidgets();
    widgets.forEach((widget) => {
        let value;
        switch (field.constructor.name) {
            case "PDFTextField2":
                value = form.getTextField(name).getText();
                break;
            case "PDFCheckBox2":
                value = form.getCheckBox(name).isChecked();
                break;
            case "PDFRadioGroup2":
                value = form.getRadioGroup(name).getSelected();
                break;
            case "PDFDropdown2":
                value = form.getDropdown(name).getSelected();
                break;
            case "PDFListbox2":
                value = form.getListbox(name).getSelected();
                break;
            case "PDFSignature2":
                value = form.getSignature(name).getContents();
                break;
            default:
                console.log(field.getName + " constructor is " + field.constructor.name);
                return;
        }
        const fieldRect = widget.getRectangle();
        pageItself = pdfDoc.getPages().find((p) => p.ref == widget.P());
        pageIndex = pdfDoc.getPages().findIndex((p) => p.ref == widget.P());
        //console.log(name + "'s page number: " + pageIndex);
        if (pageNumber === pageIndex) {
            createEditableField(fieldRect, pageIndex, name, value, scale).then(function (editableField) {
                duplicateFieldChecker(editableField);
                canvas.appendChild(editableField);
                pageItself = null;
                pageIndex = null;

            });
        }
    });
}

function duplicateFieldChecker(fieldNow, fieldCount = 0) {
    const fields = document.querySelectorAll('#editable-field');
    fields.forEach(field => {
        if (field.getAttribute('data-field') === fieldNow.getAttribute('data-field')) {
            console.log("duplicate field found: " + field.getAttribute('data-field'));
            fieldCount++;
            const originalField = fieldNow.getAttribute('data-field');
            const fieldName = originalField.split('#')[0]; // Assuming the field name is separated by an  (#)
            fieldNow.setAttribute('data-field', fieldName + '#' + fieldCount);
            console.log("fieldCount: " + fieldCount);
            duplicateFieldChecker(fieldNow, fieldCount);
        }
    });
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
