import { api, LightningElement, track, wire } from 'lwc';
import getTransactions from '@salesforce/apex/Transaction_Entry_Controller.getTransactions';

const recordsPerPage = [5,10,15,20,25];
const columns = [
    { label:'TX Entry Name', fieldName: 'recordLink', type: 'url', 
            typeAttributes: {label: {fieldName: 'Name'}, tooltip:'Go to detail page', target: '_blank'}},
    { label: 'Tx Number', fieldName:'Tx_Auto_Number__c', type:'text'},
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency', cellAttributes: { alignment: 'left' } },
    { label: 'Transaction Date', fieldName: 'Transaction_Date__c', type: 'date', typeAttributes:{timeZone:'UTC', year:'numeric', month:'numeric', day:'numeric'}},
    { label: 'Type', fieldName: 'Type__c', type: 'text', },
    { label: 'Status', fieldName: 'Status__c', type: 'text' }
];
export default class MiniStatement extends LightningElement 
{
    @api recordId;
    @api pageSizeOptions = recordsPerPage;
    @api totalRecords;
    @api pageSize=5; 
    @track showTable = false;
    @track error; 
    @track columns = columns;

    @track data = []; //data to be displayed in the table
    @track items = []; //it contains all the records.
    @track startingRecord = 1; //start record position per page
    @track endingRecord = 0; //end record position per page
    @api totalRecountCount = 0; //total record count received from all retrieved records
    @track totalPage = 0; //total number of page is needed to display all records
    @api page = 1; //this will initialize 1st page
   

    renderedCallback()
    {
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);

        console.log('TotalRecordCount- '+JSON.stringify(this.totalRecountCount));
        console.log('Divide Value - '+JSON.stringify(this.totalRecountCount / this.pageSize));
    }
    
    handleRecordsPerPage(event)
    { 
        this.pageSize = event.target.value;   
        this.displayRecordPerPage(this.page);
        this.handleFirst(); 
    }

    @wire(getTransactions, {recordIdOfContact : '$recordId'}) 
    wiredTransactions({error,data})
    {
        if(data)
        {
            console.log('item '+JSON.stringify(data));

            var txRecords = [];
            
            for(let i=0; i<data.length; i++)
            {
                let tx = {};
                tx.rowNumber = ''+(i+1);
                tx.recordLink = '/'+data[i].Id;
                tx = Object.assign(tx, data[i]);
                txRecords.push(tx);
            }
       
            this.data = txRecords;
            this.showTable = true;

            this.items = txRecords;
            this.totalRecountCount = data.length; //here it is 23

            //console.log('item '+JSON.stringify(this.items));
            //console.log('Slice '+JSON.stringify(this.items.slice(0,this.pageSize)));
            
             
            this.data = this.items.slice(0,this.pageSize); 
            this.endingRecord = this.pageSize;
            this.columns = columns;

            //console.log('this.data'+JSON.stringify(this.data));
        }
        else if (error) 
        {
            this.error = error;
            this.data = undefined;
        }     
    }

    //clicking on previous button this method will be called
    handlePrevious() 
    {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    handleNext() 
    {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    handleFirst()
    {
        this.page = 1;
        this.displayRecordPerPage(this.page);
    }

    handleLast() {
        this.page = this.totalPage;
        this.displayRecordPerPage(this.page);
    }


    //this method displays records page by page
    displayRecordPerPage(page){

        /*let's say for 2nd page
        page = 2; pageSize = 5; startingRecord = 5, endingRecord = 10
        so, slice(5,10) will give 5th to 9th records.
        */
        this.startingRecord = ((page -1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                            ? this.totalRecountCount : this.endingRecord; 

        this.data = this.items.slice(this.startingRecord, this.endingRecord);

        //increment by 1 to display the startingRecord count, 
        //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
        this.startingRecord = this.startingRecord + 1;
    }   
}