const scale = 2;
export default async function editForm(pdfDoc, form, fieldCRUD, scale = 2) {
    if (!pdfDoc) return;
    // Check all fields to see if they are marked as dirty
    const fields = form.getFields();
    fields.forEach(field => {
        if (form.fieldIsDirty(field.ref)) {
            const fieldName = field.getName();
            let matchFound = false;
            let newField = null;
            // Check if the field's name matches any fieldCRUD fieldTitles

            if (fieldCRUD.readField(fieldName) != undefined) {
                matchFound = true;
                newField = fieldCRUD.readField(fieldName);
                console.log("match found for " + fieldName)
            }


            // Check if the field's name matches any fieldCRUD old fieldTitles
            if (!matchFound) {
                if (fieldName === fieldCRUD.getfieldOldTitle(fieldName)) {
                    matchFound = true;
                    newField = fieldCRUD.readField(fieldName);
                    console.log("oldmatch found for " + fieldName)
                }
            }

            // Create replacement fields for removed fields
            // Create a replacement field in its place
            if (matchFound) {
                form.removeField(field);
                console.log("removed field " + fieldName)
                console.log(newField)
                let page = pdfDoc.getPage(parseInt(fieldCRUD.getPageIndex(newField.fieldTitle)));
                let fieldRect = fieldCRUD.getAcrofieldWidgets(newField.fieldTitle);
                console.log(fieldRect);
                //let color = fieldCRUD.getFontColor(newField.fieldTitle);

                const textPosition = {
                    x: parseInt(fieldRect.x) * (1 / scale),
                    y: parseInt(fieldRect.y) * (1 / scale),
                    width: parseInt(fieldRect.width) * (1 / scale),
                    height: parseInt(fieldRect.height) * (1 / scale),
                    //textColor: color TODO: `options.textColor` must be of type `Color` or `n`
                    //font:fieldCRUD.getFontFamily(newField) TODO: error here because of pdfDoc embedfont
                }
                if (fieldCRUD.getFieldInnerText(newField.fieldTitle) == 'true' || fieldCRUD.getFieldInnerText(newField.fieldTitle) == 'false') {
                    const newCheckBox = form.createCheckBox(fieldName)
                    if (fieldCRUD.getFieldInnerText(newField) == 'true') {
                        newCheckBox.check();
                    }
                    newCheckBox.addToPage(page, textPosition)
                } else {
                    const replacementField = form.createTextField(newField.fieldTitle);
                    replacementField.setText(fieldCRUD.getFieldInnerText(newField.fieldTitle).text);
                    replacementField.addToPage(page, textPosition);
                }
            }
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
