import { StandardFonts, PDFName, PDFRef, rgb } from 'https://cdn.skypack.dev/pdf-lib';
const scale = 2;
export default async function editForm(pdfDoc, form, fieldCRUD, scale = 2) {
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    if (!pdfDoc) return;
    // Check all fields to see if they are marked as dirty
    const fields = form.getFields();
    fields.forEach(field => {
        if (form.fieldIsDirty(field.ref)) {
            const fieldName = field.getName();
            let newField = null;
            // Check if the field's name matches any fieldCRUD fieldTitles
            if (fieldCRUD.readField(fieldName) != undefined) {
                newField = fieldCRUD.readField(fieldName);
                //console.log("match found for " + fieldName)
            }
            let color = stringtoRGB(fieldCRUD.getFontColor(newField.fieldTitle));
            //let font = fieldCRUD.getFontFamily(newField)
            let size = parseInt(fieldCRUD.getFontSize(newField.fieldTitle));
            if (newField.newTitle === null) {
                newField.newTitle = fieldName;
            }
            const widgets = field.acroField.getWidgets();
            widgets.forEach((widget, index) => {
                let newPdfField = null;
                let page = pdfDoc.getPage(parseInt(newField.pageIndex));
                // Remove the old field from the form
                while (field.acroField.getWidgets().length) {
                    field.acroField.removeWidget(0);
                }
                if (index == 0) {
                    form.removeField(field);
                    const textPosition = {
                        x: parseInt(widget.getRectangle().x) * (1 / scale),
                        y: parseInt(widget.getRectangle().y) * (1 / scale),
                        width: parseInt(widget.getRectangle().width) * (1 / scale),
                        height: parseInt(widget.getRectangle().height) * (1 / scale),
                    }
                    // widget.setRectangle(textPosition);
                    // Create a new field with the same name and flags as the old field
                    if (field.constructor.name == "PDFTextField2") {
                        newPdfField = form.createTextField(newField.newTitle);
                        //console.log("The text of " + newField.newTitle + " is " + newField.fieldInnerText.text)
                        if (newField.fieldInnerText.text != null)
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
                }
                else {
                    if (field.constructor.name == "PDFTextField2") {
                        newPdfField = form.getTextField(newField.newTitle)
                    }
                    const widgetPos = {
                        x: parseInt(widget.getRectangle().x),
                        y: parseInt(widget.getRectangle().y),
                        width: parseInt(widget.getRectangle().width),
                        height: parseInt(widget.getRectangle().height),
                    }
                    newPdfField.addToPage(page, {
                        x: widgetPos.x,
                        y: widgetPos.y,
                        width: widgetPos.width,
                        height: widgetPos.height,
                        textColor: rgb(color[0], color[1], color[2]),
                        font: helvetica, // will change this later
                    })
                }

            });
        }
    });

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

function stringtoRGB(hex) {
    let rgb = hex.substring(4, hex.length - 1)
        .replace(/ /g, '')
        .split(',');
    const r = parseFloat(rgb[0])
    const g = parseFloat(rgb[1])
    const b = parseFloat(rgb[2])
    return [+(r / 255).toFixed(3), +(g / 255).toFixed(3), +(b / 255).toFixed(3)];
};
