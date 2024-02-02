export default function pageIndexFinder(pages, PDFRef) {
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].ref === PDFRef) {
            //console.log(pages[i].ref + " equals " + PDFRef);
            return i;
        }
        else {
            //console.log("Page " + i + " ref " + pages[i].ref + " does not equal " + PDFRef);
        }
    }
    return -1;
}