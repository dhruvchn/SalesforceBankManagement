public with sharing class Transaction_Statement 
{
    @AuraEnabled(cacheable = true)
    public static List<Transaction_Entry__c> getStatement(Id recordIdOfContact, String statementStartDate, String statementEndDate){

        try 
        {
            Date sDate = Date.valueOf(statementStartDate);
            Date eDate = Date.valueOf(statementEndDate);

            Integer monthsBetween = sDate.monthsBetween(eDate);

            List<Transaction_Entry__c> Transaction_Entry_List = new List<Transaction_Entry__c>(); 

            if (monthsBetween < 6) {
                Transaction_Entry_List = [SELECT Id, Name, Amount__c, AmountForPdf__c, Transaction_Date__c, Type__c, Status__c	FROM Transaction_Entry__c 
                WHERE Transaction_Date__c >: sDate AND Transaction_Date__c <: eDate
                AND
                Contact__c =: recordIdOfContact];
            }

            for(Integer i=0; i<Transaction_Entry_List.size(); i++){
                Transaction_Entry_List[i].AmountForPdf__c = Transaction_Entry_List[i].Amount__c.toPlainString().replace('.','.');
            System.debug('AmountForPdf '+Transaction_Entry_List[i].AmountForPdf__c);
            }
            return Transaction_Entry_List;
        } 
        catch (Exception e) 
        {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string sendEmail(String pdfBody, Id recordIdOfContact)
	{
        Messaging.EmailFileAttachment attach = new Messaging.EmailFileAttachment();
        attach.setContentType('application/pdf');
        attach.setFileName('Report.pdf');
        attach.setInline(false);
        attach.Body = EncodingUtil.base64Decode(pdfBody);

        list<Messaging.singleEmailMessage> mails=new list<Messaging.SingleEmailMessage>();
        
        Messaging.singleEmailMessage mail=new Messaging.SingleEmailMessage();
           
        Contact con = [SELECT Id, Email FROM Contact WHERE ID =: recordIdOfContact];

        list<String> toadd = new List<String>{con.Email};

        mail.setFileAttachments(new Messaging.EmailFileAttachment[] { attach });
        mail.setToAddresses(toadd);
        mail.setSubject('Pdf Report');
        mail.setPlainTextBody('Transaction PDF Attachment');
        mails.add(mail);
        messaging.sendEmail(mails);
        return null;
    }
}