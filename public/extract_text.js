// get the fieldValues from a PDF form
export default async function extractText(pdfDoc) {
    var result = {};
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    fields.forEach(field => {
        //console.log(field);
        if (field.constructor.name == "PDFTextField2") {
            const name = field.getName()
            const textField = form.getTextField(name)
            const inner = textField.getText()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroCheckBox2") {
            const name = field.getName()
            const checkBox = form.getCheckBox(name)
            const inner = checkBox.isChecked()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroRadioButton2") {
            const name = field.getName()
            const radioButton = form.getRadioGroup(name)
            const inner = radioButton.getSelectedButton()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroComboBox2") {
            const name = field.getName()
            const comboBox = form.getComboBox(name)
            const inner = comboBox.getSelected()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroListBox2") {
            const name = field.getName()
            const listBox = form.getListBox(name)
            const inner = listBox.getSelected()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroSignature2") {
            const name = field.getName()
            const signature = form.getSignature(name)
            const inner = signature.getContents()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroButton2") {
            const name = field.getName()
            const button = form.getButton(name)
            const inner = button.getOnValue()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroText2") {
            const name = field.getName()
            const text = form.getText(name)
            const inner = text.getText()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroChoice2") {
            const name = field.getName()
            const choice = form.getChoice(name)
            const inner = choice.getSelected()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroNonTerminalField2") {
            const name = field.getName()
            const nonTerminalField = form.getNonTerminalField(name)
            const inner = nonTerminalField.getFields()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroTerminalField2") {
            const name = field.getName()
            const terminalField = form.getTerminalField(name)
            const inner = terminalField.getFields()
            result[name] = inner;
        }
        if (field.constructor.name == "PDFAcroField2") {
            const name = field.getName()
            const acroField = form.getField(name)
            const inner = acroField.getFields()
            result[name] = inner;
        }
        //result.append(field.getName(), field.getText());
    })
    //console.log(result + " has the entries of " + Object.entries(result)); 
    // 
    return result;
}
