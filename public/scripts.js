import { PDFDocument, PDFName, PDFRef } from 'https://cdn.skypack.dev/pdf-lib';
import * as pdfjs_viewer from './pdfjs-dist/build/pdf.mjs';
import createEditableField from './usermod/createEditableField.js';
import displayFields from './usermod/displayFields.js';
import editForm from './usermod/saveForm.js';
import FieldCRUD from './usermod/fieldClassCRUD.js';
import duplicateFieldChecker from './usermod/duplicateFieldChecker.js';

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
const fieldCRUD = new FieldCRUD();
const pdfContainer = document.getElementById('pdf-container');


document.getElementById("loadPdfBtn").addEventListener("click", loadPdf);
document.getElementById("editFormBtn").addEventListener("click", () => { editForm(pdfDoc, form, fieldCRUD) });
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
                var lastChild = pdfContainer.lastChild; // Get the first child

                renderTask.promise.then(function () {
                    console.log('Page rendered');
                    pdfContainer.insertBefore(pdfframe, lastChild.nextSibling); // Insert the child after the first child
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
    if (canvas.firstChild || pdfContainer.childElementCount > 1) {
        if (confirm("Changes will be lost if you press OK and replace the current PDF. Press Cancel to keep the current PDF.")) {
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            for (let i = 0; i < pdfContainer.childElementCount; i++) {
                const pdfframe = document.getElementById('pdfframe');
                if (pdfframe != null) {
                    pdfContainer.removeChild(pdfframe);
                }
            }
            // reset pdfDoc
            pdfDoc = null;
            console.log("pdfDoc is " + pdfDoc)
            // clear all fields in fieldCRUD
            fieldCRUD.clearFields();

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
        var lastChild = pdfContainer.lastChild; // Get the first child

        renderTask.promise.then(function () {
            console.log('Page rendered');
            pdfContainer.insertBefore(pdfframe, lastChild.nextSibling); // Insert the child after the first child
            renderPdfFields(pageNumber); // add editable fields on top of pdf 
        });
    });
    console.log('PDF loaded');
}

function createEF(field, form, pageNumber) {
    let name = field.getName();
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
        //const pageItself = pdfDoc.getPages().find((p) => p.ref == widget.P());

        const pageIndex = pdfDoc.getPages().findIndex((p) => widget.P() == p.ref);
        if (pageIndex == null) {
            // TODO: do something
        }

        //console.log(name + "'s page number: " + pageIndex);
        if (pageNumber === pageIndex) {
            createEditableField(fieldRect, pageIndex, name, value, scale).then(function (editableField) {
                const widgetCount = duplicateFieldChecker(editableField);
                canvas.appendChild(editableField);
                const innerTextBlock = {
                    text: editableField.innerText,
                    fontSize: editableField.style.fontSize || null,
                    fontColor: editableField.style.color || null,
                    fontStyle: editableField.style.fontStyle || null,
                    fontFamily: editableField.style.fontFamily || null
                }
                fieldCRUD.createField(name, innerTextBlock, fieldRect, pageIndex);
                fieldCRUD.setWidgetCount(name, widgetCount);
                console.log(fieldCRUD.readField(name));

            });
        }
    });
}

document.querySelector(".modal-ok").addEventListener("click", function (e) {
    //let modalContent = e.target.parentElement;
    const efb = document.querySelector('.modal-body');
    // get the editable field div with a query selector using the modal's data-field attribute
    // to match with the editable field's data-field attribute
    const modalDataField = efb.querySelector('#dataField').value;
    const editableFieldDiv = document.querySelector(`[data-field="${modalDataField}"]`);
    const oldField = editableFieldDiv.getAttribute('data-oldfield');
    console.log(oldField);
    let read = fieldCRUD.readField(modalDataField);
    console.log(read);
    if (read == undefined) {
        read = fieldCRUD.findFieldByOldTitle(oldField);
        console.log("field not found, using old title " + oldField + " instead");
        console.log(read);
    }
    console.log("setting text to: " + efb.querySelector('#innerText').value + " on the page " + pageNumber);
    let innerTextBlock = {
        text: efb.querySelector('#innerText').value,
        fontSize: efb.querySelector('#fontSize').value || null,
        fontColor: efb.querySelector('#fontColor').value || null,
        fontStyle: efb.querySelector('#fontStyle').value || null,
        fontFamily: efb.querySelector('#fontFamily').value.replace(/"/g, '') || null,
        fontWeight: efb.querySelector('#fontWeight').value || null
    }
    let fieldRect = fieldCRUD.getAcrofieldWidgets(modalDataField);
    fieldCRUD.updateField(modalDataField,
        innerTextBlock,
        fieldRect,
        pageNumber);
    // console.log type of efb.getAttribute('data-field')
    // markfieldasdirty
    console.log("marking field as dirty: " + form.getFieldMaybe(modalDataField));
    let fieldDirty = form.getFieldMaybe(modalDataField)
    if (fieldDirty == undefined) {
        fieldCRUD.setNewTitle(oldField, modalDataField);
        console.log("Let's try old title:  " + fieldCRUD.getfieldOldTitle(oldField) + " is the old title of " + fieldCRUD.findFieldByOldTitle(oldField));
        fieldDirty = form.getFieldMaybe(fieldCRUD.getfieldOldTitle(oldField));
        console.log(fieldDirty);
    }

    if (fieldDirty != undefined) {
        form.markFieldAsDirty(fieldDirty.ref);
        console.log("Dirt marked: " + fieldDirty.ref);
    } else {
        // the field must be saved to the form first. next OK we can set it as dirty
        console.log("saving field " + modalDataField);
        let newField = form.createTextField(modalDataField)
        if (efb.querySelector('#innerText').value != ' ') {
            newField.setText(efb.querySelector('#innerText').value);
        }
        const textPosition = {
            x: parseInt(fieldRect.x) * (1 / scale),
            y: parseInt(fieldRect.y) * (1 / scale),
            width: parseInt(fieldRect.width) * (1 / scale),
            height: parseInt(fieldRect.height) * (1 / scale),
            textColor: (innerTextBlock.color),
            //font: innerTextBlock.fontFamily TODO: error here because of pdfDoc embedfont
        }
        let page = pdfDoc.getPage(pageNumber)
        newField.addToPage(page, textPosition);
        console.log("new field added to page " + fieldCRUD.getPageIndex(modalDataField));
    }
});

pdfContainer.addEventListener('drop', function (event) {
    event.preventDefault();
    let editableField = canvas.lastChild;

    let innerTextBlock = {
        text: editableField.innerText,
        fontSize: editableField.style.fontSize || null,
        fontColor: editableField.style.color || null,
        fontStyle: editableField.style.fontStyle || null,
        fontFamily: editableField.style.fontFamily || null
    }
    let fieldRect = {
        x: editableField.style.left,
        y: editableField.style.bottom,
        width: editableField.style.width,
        height: editableField.style.height
    }
    let pageNumber = editableField.getAttribute('data-page');
    console.log("adding droppable field to fieldCRUD");
    fieldCRUD.createField(editableField.getAttribute('data-field'), innerTextBlock, fieldRect, pageNumber);

});

// Add event listener for when mouse button is released
pdfContainer.addEventListener('mouseup', function (event) {
    let efb = event.target;
    if (efb.id != 'editable-field') {
        efb = efb.parentElement;
        if (efb.id != 'editable-field') {
            efb = null;
            return;
        }
    }
    console.log("mouseup: " + efb.id)
    let fieldRect = null;
    if (parseInt(efb.style.top) > 0) {
        fieldRect = {
            x: parseInt(efb.style.left),
            y: Math.abs(parseInt(efb.style.top) - parseInt(efb.style.bottom)),
            width: parseInt(efb.style.width),
            height: parseInt(efb.style.height)
        }
        console.log("top" + efb.style.top)
    }
    else {
        fieldRect = {
            x: parseInt(efb.style.left),
            y: parseInt(efb.style.bottom),
            width: parseInt(efb.style.width),
            height: parseInt(efb.style.height)
        }
        console.log("bottom is" + efb.style.bottom)
    }
    fieldCRUD.setAcrofieldWidgets(efb.getAttribute('data-field'), fieldRect);
    let textField = form.getFieldMaybe(efb.getAttribute('data-field'));
    if (textField) {
        // remove the textField from the page, then add it back with the new position
        let widget = textField.acroField.getWidgets()[0];
        const AP = widget.ensureAP();
        AP.set(PDFName.of('N'), PDFRef.of(0, 0));
        form.removeField(textField);
    }
    const nextField = form.createTextField(efb.getAttribute('data-field'));
    nextField.setText(efb.innerText);
    nextField.addToPage(pdfDoc.getPage(pageNumber), {
        x: parseInt(fieldRect.x) * (1 / scale),
        y: parseInt(fieldRect.y) * (1 / scale),
        width: parseInt(fieldRect.width) * (1 / scale),
        height: parseInt(fieldRect.height) * (1 / scale),
    });

    form.markFieldAsDirty(form.getFieldMaybe(efb.getAttribute('data-field')).ref);

});
