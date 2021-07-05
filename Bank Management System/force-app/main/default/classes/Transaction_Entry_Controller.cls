public with sharing class Transaction_Entry_Controller {
    @AuraEnabled(cacheable = true)
    public static List<Transaction_Entry__c> getTransactions(Id recordIdOfContact)
    {
        try 
        {
            return [SELECT Id, Name, Amount__c, Tx_Auto_Number__c,
            Transaction_Date__c, 
            Type__c, Status__c	
            FROM 
            Transaction_Entry__c 
            WHERE 
            Status__c != 'Cancelled' 
            AND 
            Contact__c =: recordIdOfContact];
        } 
        catch (Exception e) 
        {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
