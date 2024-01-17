import { StandardFonts, PDFName, PDFRef, rgb } from 'https://cdn.skypack.dev/pdf-lib';
const scale = 2;
export default async function editForm(pdfDoc, form, fieldCRUD, scale = 2) {
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    if (!pdfDoc) return;
    // Check all fields to see if they are marked as dirty
    const fields = form.getFields();
    fields.forEach(field => {
        const widgets = field.acroField.getWidgets();
        widgets.forEach((widget, index) => {
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

                console.log(newField)
                let fieldRect = fieldCRUD.getAcrofieldWidgets(newField.fieldTitle);
                console.log(fieldRect);
                let color = hexToRGB(fieldCRUD.getFontColor(newField.fieldTitle)); //TODO: error here because of pdfDoc embedfont
                //let font = fieldCRUD.getFontFamily(newField)
                let size = parseInt(fieldCRUD.getFontSize(newField.fieldTitle));
                if (newField.newTitle === null) {
                    newField.newTitle = fieldName;
                }
                const textPosition = {
                    x: parseInt(fieldRect.x) * (1 / scale),
                    y: parseInt(fieldRect.y) * (1 / scale),
                    width: parseInt(fieldRect.width) * (1 / scale),
                    height: parseInt(fieldRect.height) * (1 / scale),
                }
                widget.setRectangle(textPosition);
                let newPdfField = null;

                // Remove the old field from the form
                while (field.acroField.getWidgets().length) {
                    field.acroField.removeWidget(0);
                }
                if (index == 0) {
                    form.removeField(field);
                    // Create a new field with the same name and flags as the old field
                    if (field.constructor.name == "PDFTextField2") {
                        newPdfField = form.createTextField(newField.newTitle);
                        newPdfField.setText(newField.fieldInnerText.text);
                    } else if (field.constructor.name == "PDFCheckBox2") {
                        newPdfField = form.createCheckBox(newField.newTitle);
                        // elseifs are not tested yet
                        if (field.isChecked()) {
                            newPdfField.check();
                        }
                    } else if (field.constructor.name == "PDFRadioGroup2") {
                        newPdfField = form.createRadioGroup(newField.newTitle);
                        newPdfField.setOptions(field.getOptions());
                        if (field.isSelected()) {
                            newPdfField.select(field.getSelected());
                        }
                    } else if (field.constructor.name == "PDFDropdown2") {
                        newPdfField = form.createDropdown(newField.newTitle);
                        newPdfField.setOptions(field.getOptions());
                        newPdfField.select(field.getSelected());
                    } else if (field.constructor.name == "PDFSignature2") {
                        newPdfField = form.createSignature(newField.newTitle);
                        // pdf-lib does not currently provide any specialized APIs
                        // for creating digital signatures or reading the contents 
                        // of existing digital signatures.
                    }
                    let page = pdfDoc.getPage(newField.pageIndex)
                    newPdfField.addToPage(page,
                        {
                            x: textPosition.x,
                            y: textPosition.y,
                            width: textPosition.width,
                            height: textPosition.height,
                            textColor: rgb(color[0], color[1], color[2]),
                            font: helvetica, // will change this later
                        })
                    newPdfField.setFontSize(size);
                    //newPdfField.acroField.addWidget(field.ref)

                    // Set the position and size of the new field to match the widget
                    //newPdfField.acroField.setRectangle(widget.getRectangle());

                    // Set other properties of the new field to match the old field
                    // ... add code here ...
                }
            } else {
                if (field.constructor.name == "PDFTextField2") {
                    newPdfField = form.getTextField(newField.newTitle)
                    newPdfField.updateAppearances(helvetica, (field, widget, font) => {
                        // something here
                        return drawTextField({
                            x: widgets[index].getRectangle.x,
                            y: widgets[index].getRectangle.y,
                            width: textPosition.width,
                            height: textPosition.height,
                            textColor: rgb(color[0], color[1], color[2]),
                            font: helvetica, // will change this later
                        })
                    })
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
