export default class FieldCRUD {
    constructor() {
        this.fields = {};
    }

    createField(fieldTitle, fieldInnerText, acrofieldWidgets, pageIndex) {
        const title = fieldTitle;
        this.fields[title] = {
            fieldTitle: title,
            fieldInnerText: {
                text: fieldInnerText,
                fontSize: fieldInnerText.fontSize || null,
                fontColor: fieldInnerText.fontColor || null,
                fontStyle: fieldInnerText.fontStyle || null,
                fontFamily: fieldInnerText.fontFamily || null,
                fontWeight: fieldInnerText.fontWeight || null
            },
            acrofieldWidgets,
            pageIndex,
            fieldOldTitle: title,
            newTitle: null,
            widgetCount: 0
        };
    }

    clearFields() {
        this.fields = {};
    }

    readField(fieldTitle) {
        return this.fields[fieldTitle] || undefined;
    }

    updateField(fieldTitle, updatedFieldInnerText, updatedAcrofieldWidgets, updatedPageIndex) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText = updatedFieldInnerText;
            if (updatedAcrofieldWidgets != null) {
                field.acrofieldWidgets = updatedAcrofieldWidgets;
            }
            field.pageIndex = updatedPageIndex;
        }
    }

    deleteField(fieldTitle) {
        delete this.fields[fieldTitle];
    }

    // Getter for fieldInnerText
    getFieldInnerText(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText : undefined;
    }

    // Setter for fieldInnerText
    setFieldInnerText(fieldTitle, updatedFieldInnerText) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText = updatedFieldInnerText;
        }
    }

    // Getter for acrofieldWidgets
    getAcrofieldWidgets(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.acrofieldWidgets : undefined;
    }

    // Setter for acrofieldWidgets
    setAcrofieldWidgets(fieldTitle, updatedAcrofieldWidgets) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.acrofieldWidgets = updatedAcrofieldWidgets;
        }
    }

    // Getter for pageIndex
    getPageIndex(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.pageIndex : undefined;
    }

    // Setter for pageIndex
    setPageIndex(fieldTitle, updatedPageIndex) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.pageIndex = updatedPageIndex;
        }
    }
    // Getter for fieldOldTitle
    getfieldOldTitle(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field.fieldOldTitle;
    }

    // find field by old title
    findFieldByOldTitle(fieldOldTitle) {
        for (const fieldTitle in this.fields) {
            if (this.fields[fieldTitle].fieldOldTitle === fieldOldTitle) {
                return this.fields[fieldTitle].fieldTitle;
            }
        }
        return undefined;
    }

    // setter and getter for newTitle
    setNewTitle(fieldTitle, newTitle) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.newTitle = newTitle;
        }
    }

    getNewTitle(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.newTitle : undefined;
    }

    // setter for widgetCount
    setWidgetCount(fieldTitle, widgetCount) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.widgetCount = widgetCount;
        }
    }

    // getter for widgetCount
    getWidgetCount(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.widgetCount : undefined;
    }

    // Getter for inner text's font size
    getFontSize(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText.fontSize : undefined;
    }

    // Setter for inner text's font size
    setFontSize(fieldTitle, updatedFontSize) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText.fontSize = updatedFontSize;
        }
    }

    // Getter for inner text's font color
    getFontColor(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText.fontColor : undefined;
    }

    // Setter for inner text's font color
    setFontColor(fieldTitle, updatedFontColor) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText.fontColor = updatedFontColor;
        }
    }

    // Getter for inner text's font family
    getFontFamily(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText.fontFamily : undefined;
    }

    // Setter for inner text's font family
    setFontFamily(fieldTitle, updatedFontFamily) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText.fontFamily = updatedFontFamily;
        }
    }

    // Getter for inner text's font style
    getFontStyle(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText.fontStyle : undefined;
    }

    // Setter for inner text's font style
    setFontStyle(fieldTitle, updatedFontStyle) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText.fontStyle = updatedFontStyle;
        }
    }

    // Getter for inner text's font weight
    getFontWeight(fieldTitle) {
        const field = this.fields[fieldTitle];
        return field ? field.fieldInnerText.fontWeight : undefined;
    }

    // Setter for inner text's font weight
    setFontWeight(fieldTitle, updatedFontWeight) {
        const field = this.fields[fieldTitle];
        if (field) {
            field.fieldInnerText.fontWeight = updatedFontWeight;
        }
    }

}
