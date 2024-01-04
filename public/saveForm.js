const scale = 2;
export default async function editForm(pdfDoc, scale = 2) {
    if (!pdfDoc) return;
    // add editable-fields on top of pdf
    const editableFields = document.querySelectorAll('#editable-field');
    //for (let pageNum = 0; pageNum <= pdfDoc.getPageCount(); pageNum++) {
    //const pageNum = 0;
    editableFields.forEach(editableField => {
        const fieldName = editableField.getAttribute('data-field');
        const pageNum = Number(editableField.getAttribute('data-page'));
        const target = editableField;
        // { x, y, width, height } 
        const x = parseInt(target.style.left) * (1 / scale);
        const y = parseInt(target.style.bottom) * (1 / scale); // TODO: opposite of y + pageHeight / scale * pageIndexOffset) * scale
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
            console.log(pageNum + " removing " + field.getName() + "| original |" + fieldName);
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
            if (editableField.text != ' ') {
                newTextField.setText(editableField.text);
            }
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
