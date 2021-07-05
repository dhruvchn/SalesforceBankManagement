global with sharing class MonthlyTransactionDetailOnEmail implements Database.Batchable<sObject>, Database.Stateful
{
    global Database.QueryLocator start(Database.BatchableContext BC)
    {
        String query = 'SELECT Id,Name,Status__c,Email,Account_Number__c,Available_Balance__c,(SELECT Id,TX_Entry_Name__c, Type__c, Transaction_Result__c, Transaction_Date__c, Status__c from Transaction_Entry__r Where CreatedDate = THIS_MONTH ORDER BY CreatedDate ASC) FROM Contact';
       
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext BC, List<Contact> scope)
    {
        List<Messaging.SingleEmailMessage> contactEmailMail = new List<Messaging.SingleEmailMessage>();

        if(scope.size()>0)
        {
            for(Contact contact : scope)
            {
                if(contact.Status__c == 'Active')
                {
                    if(contact.Email != Null)
                    {
                        
                        List<Transaction_Entry__c> listOfSingleContactEntry = contact.Transaction_Entry__r;
                        
                        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                        
                        email.setSubject('Transaction details of a month');

                        String[] toAddresses = new String[] {contact.Email};

                        email.setToAddresses(toAddresses);

                        String htmlBody='<p>Your Available balance is '+ contact.Available_Balance__c+'</p><br>'+
                               +'<table style="width:100%;border: 1px solid black;border-collapse: collapse">'+
                               +'<tr style="border: 1px solid black;border-collapse: collapse">'+
                               +'<th style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse"> Account No</th>'+
                               +'<th style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse"> TX Entry Name</th>'+
                               +'<th style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse"> TX_Type</th>'+
                               +'<th style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse"> TX_Date</th>'+
                               +'<th style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse"> TX_Status</th>'+
                               +'</tr>';
                               
                        for(Transaction_Entry__c singleTransactionEntries:listOfSingleContactEntry)
                        {
                        htmlBody +='<tr style="border: 1px solid black;border-collapse: collapse">'+
                               +'<td style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse">'+contact.Account__c+'</td>'+
                               +'<td style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse">'+singleTransactionEntries.Name+'</td>'+
                               +'<td style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse">'+singleTransactionEntries.Type__c+'</td>'+
                               +'<td style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse">'+singleTransactionEntries.Transaction_Date__c+'</td>'+
                               +'<td style="padding: 5px;text-align: left;border: 1px solid black;border-collapse: collapse">'+singleTransactionEntries.Status__c+'</td>'+
                               +'</tr>';
                        }

                        htmlBody += '</table><br>';

                        email.setHtmlBody(htmlBody);

                        contactEmailMail.add(email);
                    }
                }
           }
        }
        
        if(contactEmailMail.size()>0)
         Messaging.sendEmail(contactEmailMail);   
    }
    global void finish(Database.BatchableContext BC) {

    }
}