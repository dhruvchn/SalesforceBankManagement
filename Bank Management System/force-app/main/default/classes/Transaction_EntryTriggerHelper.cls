/**
*  Description     :  Trigger Class for rigger_Transaction_Entry Trigger
*
*  Created By      :  Dhruvraj Singh Chouhan
*
*  Created Date    :  7/1/2021
*
*  Revision Logs   :    V1.1 - Created  - 7/1/2021 - Dhruvraj Singh Chouhan
*
**/
public with sharing class Transaction_EntryTriggerHelper {
    
        /** 
    *   @description	:   Method To Perfrom When it’s a debit entry, 
                            deduct the amount from the contact level AvailableBalance field.
    *
    *    @args			:   List<Transaction_Entry__C>
    *
    *    @return		:   void
    *
    *    @revision Log	:   V1.1 - Created  - 7/1/2021 - Dhruvraj Singh Chouhan  
    **/    
    public static void recentTransaction(List<Transaction_Entry__c> transaction_entryList)
    {
        Decimal checkForAvailableBalance;

        Set<Id> setOfContactId=new set<Id>();

        List<Contact> conList = new List<Contact>();
        
        //get the set of contact Id
        for(Transaction_Entry__c  transaction_EntryData : transaction_entryList)
        {
            //Storing Id in Set
            setOfContactId.add(transaction_EntryData.Contact__c);
        }

        //Query on Contact to retrieve Transaction limit and contact data
        Map<Id, Contact> mapIdWithContacts = new Map<Id,Contact>([SELECT Id,Name , Status__c, 
            Available_Balance__c, Account__c, Transaction_Limit__r.Id,
            Transaction_Limit__r.Maximum_Debit_Allowed_per_Day__c,
            Transaction_Limit__r.Maximum_Debit_Allowed_per_Month__c,
            Transaction_Limit__r.Maximum_Debit_Allowed_pe__c,
            Transaction_Limit__r.Maximum_Transactions_Allowed_per_Day__c,
            Transaction_Limit__r.Maximum_Transactions_Allowed_per_Mont__c 
            FROM Contact 
            WHERE ID 
            IN: setOfContactId]);

        //list of aggregate result of a contact on a daily basis
        List<AggregateResult> listWithAggregateParticularDayContact = [SELECT Contact__c,   
                            Count(Name)TotalTransaction,
                            Sum(Amount__c)TotalAmmount	
                            FROM Transaction_Entry__c
                            WHERE Contact__c 
                            IN: setOfContactId AND
                            CreatedDate = TODAY  
                            AND Status__c = 'Completed' AND
                            Type__c = 'Debit'
                            GROUP BY Contact__c];

        //list of aggregate result of a contact on a daily basis
        List<AggregateResult> listWithAggregateParticularMonthContact = [SELECT Contact__c,   
                            Count(Name)TotalTransaction,
                            Sum(Amount__c)TotalAmmount	
                            FROM Transaction_Entry__c
                            WHERE Contact__c 
                            IN: setOfContactId AND
                            CreatedDate = THIS_MONTH  
                            AND Status__c = 'Completed'AND
                            Type__c = 'Debit' 
                            GROUP BY Contact__c];
                 
        //Map
        Map<Id,AggregateResult> mapWithAggregateParticularMonthContact = new Map<Id,AggregateResult>();

        Map<Id,AggregateResult> mapWithAggregateParticularDayContact = new Map<Id,AggregateResult>();
        
        //Adding Contact Id with Aggregate Result
        if(listWithAggregateParticularMonthContact.size()>0)
        {
            for(AggregateResult aggregateMonthContactResult : listWithAggregateParticularMonthContact)
            {
                mapWithAggregateParticularMonthContact.put((Id)aggregateMonthContactResult.get('Contact__c'),aggregateMonthContactResult);
            }

            if(listWithAggregateParticularDayContact.size()>0)
            {
                for(AggregateResult aggregateDayContactResult : listWithAggregateParticularDayContact)
                {
                    mapWithAggregateParticularDayContact.put((Id)aggregateDayContactResult.get('Contact__c'),aggregateDayContactResult);
                }
            }
        }
 
        for(Transaction_Entry__c transaction_Entry_Obj : transaction_entryList)
        {
            //Here by using Map we are getting Id of contact from mapIdWithContacts.get();
            Contact contact_Of_Transaction = mapIdWithContacts.get(transaction_Entry_Obj.Contact__c);
            
            if(contact_Of_Transaction.Status__c == 'Active')
            {
                Integer totalMonthlyTransaction = 0;
                Decimal totalMonthlyAmmount = 0;
                Integer totalDailyTransaction = 0;
                Decimal totalDailyAmmount = 0;
 
 
                System.debug('totalMonthlyTransaction : '+ totalMonthlyTransaction);
                System.debug('totalMonthlyAmmount : ' + totalMonthlyAmmount);
                System.debug('totalDailyTransaction : '+ totalDailyTransaction);
                System.debug('totalDailyAmmount : '+totalDailyAmmount);

            //
            AggregateResult monthlyTransactionResult = 
                        mapWithAggregateParticularMonthContact.get(transaction_Entry_Obj.Contact__c);

            AggregateResult dailyTransactionResult = 
                    mapWithAggregateParticularDayContact.get(transaction_Entry_Obj.Contact__c);

                if(transaction_Entry_Obj.Type__c == 'Debit' && transaction_Entry_Obj.Status__c == 'Completed')
                {
                    checkForAvailableBalance = contact_Of_Transaction.Available_Balance__c - transaction_Entry_Obj.Amount__c;
                    
                    if(monthlyTransactionResult != NULL && dailyTransactionResult!= NULL)
                    {
                        //Getting total values of month and days
                         totalMonthlyTransaction = (Integer)monthlyTransactionResult.get('TotalTransaction')+1; 

                         totalMonthlyAmmount = (Decimal)monthlyTransactionResult.get('TotalAmmount')+transaction_Entry_Obj.Amount__c; 
             
                         totalDailyTransaction=(Integer)dailyTransactionResult.get('TotalTransaction')+1;

                         totalDailyAmmount=(Decimal)dailyTransactionResult.get('TotalAmmount')+transaction_Entry_Obj.Amount__c;
                    }

                    if(checkForAvailableBalance >= 3000
                    && 
                    transaction_Entry_Obj.Amount__c <= contact_Of_Transaction.Transaction_limit__r.Maximum_Debit_Allowed_pe__c 
                    &&
                    totalMonthlyTransaction <= contact_Of_Transaction.Transaction_limit__r.Maximum_Transactions_Allowed_per_Mont__c
                    && 
                    totalMonthlyAmmount <= contact_Of_Transaction.Transaction_limit__r.Maximum_Debit_Allowed_per_Month__c
                    &&
                    totalDailyTransaction <= contact_Of_Transaction.Transaction_limit__r.Maximum_Transactions_Allowed_per_Day__c
                    &&
                    totalDailyAmmount <= contact_Of_Transaction.Transaction_limit__r.Maximum_Debit_Allowed_per_Day__c
                    )
                    {
                      contact_Of_Transaction.Available_Balance__c =  contact_Of_Transaction.Available_Balance__c - transaction_Entry_Obj.Amount__c;
                    }
                    else 
                    {
                        transaction_Entry_Obj.Status__c = 'Cancelled';
                    }
                    conList.add(contact_Of_Transaction);
                }

                else if(transaction_Entry_Obj.Type__c == 'Credit' && transaction_Entry_Obj.Status__c == 'Completed')
                {
                    contact_Of_Transaction.Available_Balance__c =  contact_Of_Transaction.Available_Balance__c + transaction_Entry_Obj.Amount__c;

                    conList.add(contact_Of_Transaction);
                }
            
                transaction_Entry_Obj.Available_Balance__c = contact_Of_Transaction.Available_Balance__c;
                transaction_Entry_Obj.Account_Number__c = contact_Of_Transaction.Account__c;
            }
            else 
            {
                transaction_Entry_Obj.Status__c = 'Cancelled';
                //transaction_Entry_Obj.addError('Contact is Deactive');
            }
        }
        update conList;
    }
}

