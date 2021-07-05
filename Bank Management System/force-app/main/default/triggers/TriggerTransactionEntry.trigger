trigger TriggerTransactionEntry on Transaction_Entry__c (before insert) {
        //Check for trigger context
    if(Trigger.isBefore)
    {
        //check for trigger event
        if(Trigger.isInsert )
        {
            //Helper class method
            Transaction_EntryTriggerHelper.recentTransaction(Trigger.new);
        }
    }
}   