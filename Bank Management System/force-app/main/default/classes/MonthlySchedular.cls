global with sharing class MonthlySchedular implements Schedulable  {
    
    global void execute(SchedulableContext ctx) 
    {
        //Batch
        MonthlyTransactionDetailOnEmail monthlyTransactionDetailOnEmailObject = new MonthlyTransactionDetailOnEmail();
    
        Id batchId = Database.executeBatch(monthlyTransactionDetailOnEmailObject);
    }
}