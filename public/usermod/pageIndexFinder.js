export default function pageIndexFinder(pdfDoc,PDFRef){
    let pages = pdfDoc.getPages();
    for(let i = 0; i < pages.length; i++) {
        if(pages[i].ref === PDFRef) {
            return i;
        }
        else {
            console.log(pages[i].ref + " does not equal " + PDFRef);}
    }
    return -1;}