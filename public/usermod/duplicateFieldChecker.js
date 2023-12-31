export default function duplicateFieldChecker(fieldNow, fieldCount = 0) {
    const fields = document.querySelectorAll('#editable-field');
    fields.forEach(field => {
        if (field.getAttribute('data-field') === fieldNow.getAttribute('data-field')
            && field.getAttribute('data-widgetCount') == fieldNow.getAttribute('data-widgetCount')) {
            console.log("duplicate field found: " + field.getAttribute('data-field'));
            fieldCount++;
            //const originalField = fieldNow.getAttribute('data-field');
            //const fieldName = originalField.split('#')[0]; // Assuming the field name is separated by an  (#)
            //fieldNow.setAttribute('data-field', fieldName + '#' + fieldCount);
            fieldNow.setAttribute('data-widgetCount', fieldCount);
            console.log("fieldCount: " + fieldCount);
            duplicateFieldChecker(fieldNow, fieldCount);
        } else {
            fieldNow.setAttribute('data-widgetCount', fieldCount);
        }
    });
    return fieldCount;
}