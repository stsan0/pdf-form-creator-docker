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
                if (fieldName === fieldCRUD.findFieldByOldTitle(fieldName)) {
                    matchFound = true;
                    newField = fieldCRUD.readField(fieldName);
                    //newField.fieldTitle = fieldCRUD.getNewTitle(fieldName);
                    console.log("oldmatch found for " + fieldName)
                    console.log("the field's newtitle should be " + fieldCRUD.getNewTitle(fieldName))
                }
            }

            // Create replacement fields for removed fields
            // Create a replacement field in its place
            console.log(field);
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
                    let newCheckBox = null;
                    if (newField.newTitle != undefined) {
                     newCheckBox = form.createCheckBox(newField.newTitle)
                    } else{
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
                    } else{
                     replacementField = form.createTextField(newField.fieldTitle); 
                    }

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
