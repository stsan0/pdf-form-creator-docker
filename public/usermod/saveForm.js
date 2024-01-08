import { StandardFonts, PDFName, PDFRef } from 'https://cdn.skypack.dev/pdf-lib';
const scale = 2;
export default async function editForm(pdfDoc, form, fieldCRUD, scale = 2) {
    if (!pdfDoc) return;
    // Check all fields to see if they are marked as dirty
    const fields = form.getFields();
    fields.forEach(field => {
        const widgets = field.acroField.getWidgets();
        widgets.forEach(widget => {
            if (form.fieldIsDirty(field.ref)) {
                const fieldName = field.getName();
                let matchFound = false;
                let newField = null;
                // Check if the field's name matches any fieldCRUD fieldTitles

                if (fieldCRUD.readField(fieldName) != undefined || fieldName === fieldCRUD.findFieldByOldTitle(fieldName)) {
                    matchFound = true;
                    newField = fieldCRUD.readField(fieldName);
                    console.log("match found for " + fieldName)
                }
                // Create replacement fields for removed fields
                // Create a replacement field in its place
                console.log(field);

                const AP = widget.ensureAP();
                AP.set(PDFName.of('N'), PDFRef.of(0, 0));
                // Remove the field from the form
                form.removeField(field);

                //console.log("removed field " + fieldName)
                console.log(newField)
                let page = pdfDoc.getPage(parseInt(fieldCRUD.getPageIndex(newField.fieldTitle)));
                let fieldRect = fieldCRUD.getAcrofieldWidgets(newField.fieldTitle);
                console.log(fieldRect);
                //let color = hexToRGB(fieldCRUD.getFontColor(newField.fieldTitle)); //TODO: error here because of pdfDoc embedfont
                //let font = fieldCRUD.getFontFamily(newField)
                //let size = parseInt(fieldCRUD.getFontSize(newField.fieldTitle));

                const textPosition = {
                    x: parseInt(fieldRect.x) * (1 / scale),
                    y: parseInt(fieldRect.y) * (1 / scale),
                    width: parseInt(fieldRect.width) * (1 / scale),
                    height: parseInt(fieldRect.height) * (1 / scale),
                    //textColor: color,

                }
                if (fieldCRUD.getFieldInnerText(newField.fieldTitle) == 'true' || fieldCRUD.getFieldInnerText(newField.fieldTitle) == 'false') {
                    let newCheckBox = null;
                    if (newField.newTitle != undefined) {
                        newCheckBox = form.createCheckBox(newField.newTitle)
                    } else {
                        newCheckBox = form.createCheckBox(fieldName)
                    }

                    if (fieldCRUD.getFieldInnerText(newField) == 'true') {
                        newCheckBox.check();
                    }
                    newCheckBox.addToPage(page, textPosition)
                } else {
                    let replacementField = null;
                    if (newField.newTitle != undefined) {
                        replacementField = form.createTextField(newField.newTitle);
                    } else {
                        replacementField = form.createTextField(newField.fieldTitle);
                    }
                    replacementField.setText(fieldCRUD.getFieldInnerText(newField.fieldTitle).text);
                    replacementField.addToPage(page, textPosition);
                }
            }
        });
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

function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [+(r / 255).toFixed(3), +(g / 255).toFixed(3), +(b / 255).toFixed(3)];
};
