public with sharing class PrintJobPDFController {
    @AuraEnabled 
    public static String getPdfFileAsBase64String(Id contactId) {
        PageReference pdfPage = Page.envelope;
        pdfPage.getParameters().put('cid',contactId);
        Blob pdfBlob = pdfPage.getContent();
        String base64Pdf = EncodingUtil.base64Encode(pdfBlob);
        return base64Pdf;
    }
}
