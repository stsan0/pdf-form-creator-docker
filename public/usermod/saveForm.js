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
                        x: parseInt(widget.getRectangle().x),
                        y: parseInt(widget.getRectangle().y),
                        width: parseInt(widget.getRectangle().width),
                        height: parseInt(widget.getRectangle().height),
                    }
                    // widget.setRectangle(textPosition);
                    // Create a new field with the same name and flags as the old field
                    if (field.constructor.name == "PDFTextField2") {
                        newPdfField = form.createTextField(newField.newTitle);
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
                        // find an API for existing signatures
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
    // if the first character is a #, call RGBtoHex
    if (hex[0] == "#") {
        hex = hexToRGBString(hex);
    }
    //console.log(hex);
    let rgb = hex.substring(4, hex.length - 1)
        .replace(/ /g, '')
        .split(',');
    //console.log(rgb);
    const r = parseFloat(rgb[0])
    const g = parseFloat(rgb[1])
    const b = parseFloat(rgb[2])
    //console.log(r, g, b);
    return [+(r / 255).toFixed(3), +(g / 255).toFixed(3), +(b / 255).toFixed(3)];
};

function hexToRGBString(hex) {
    // if the first character is a #, remove it
    if (hex[0] == "#") {
        hex = hex.substring(1);
    }
    // if the hex is 3 characters, expand it to 6
    if (hex.length == 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    // convert the hex to rgb
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4), 16);
    return "rgb(" + r + "," + g + "," + b + ")";
}