import { LightningElement, api, wire, track } from 'lwc';
import {loadScript} from "lightning/platformResourceLoader";
import JSPDF from '@salesforce/resourceUrl/jspdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getStatement from '@salesforce/apex/Transaction_Statement.getStatement';
import sendEmail from '@salesforce/apex/Transaction_Statement.sendEmail';

const columns = [
    { label:'TX Entry Name', fieldName: 'Name', type: 'text', sortable: "true"},
    { label: 'Tx Number', fieldName:'Tx_Auto_Number__c', type:'text',sortable: "true"},
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency', cellAttributes: { alignment: 'left' },         sortable: "true" },
    { label: 'Transaction Date', fieldName: 'Transaction_Date__c', type: 'date', 
            typeAttributes:  {timeZone:'UTC', year:'numeric', month:'numeric', day:'numeric'},sortable: "true"},
    { label: 'Type', fieldName: 'Type__c', type: 'text', sortable: "true"},
    { label: 'Status', fieldName: 'Status__c', type: 'text',sortable: "true" }
];

export default class Statement extends LightningElement {
    @api totalRecountCount = 0; //total record count received from all retrieved records
    @api totalRecords;
    @api pageSize=5; 
    @api page = 1; //this will initialize 1st page
    @track startingRecord = 1; //start record position per page
    @track endingRecord = 0; //end record position per page
    @track totalPage = 0; //total number of page is needed to display all records

    @track item=[];

    @api StartDate;
    @api EndDate;
    @api recordId;
    @track showTable;
    @track data=[];
    @track error=[];
    @track columns = columns;
    @track sortBy;
    @track sortDirection;
    @track showTableOnClick

    headers = this.createHeaders([
		"Name",
		"AmountForPdf__c",
        "Transaction_Date__c",
        "Type__c",
        "Status__c"
	]);
    
    renderedCallback() {
		Promise.all([
			loadScript(this, JSPDF)
		]);
        
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
        
        console.log('TotalRecordCount- '+JSON.stringify(this.totalRecountCount));
        console.log('Divide Value - '+JSON.stringify(this.totalRecountCount / this.pageSize));
        console.log('Total Page '+this.totalPage)
	}

    generatePdf(){
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF({
			encryption: {
				userPermissions: ["print", "modify", "copy", "annot-forms"]
				// try changing the user permissions granted
			}
		});

		doc.text("Trasaction Statement", 20, 20);
		doc.table(30, 30, this.data, this.headers, { autosize:true });
		doc.save("statement.pdf");
	}

    generatePdfForEmail(){
        const { jsPDF } = window.jspdf;
		const doc = new jsPDF({
			encryption: {
				userPermissions: ["print", "modify", "copy", "annot-forms"]
				// try changing the user permissions granted
			}
		});

		doc.text("Trasaction Statement", 20, 20);
		doc.table(30, 30, this.data, this.headers, { autosize:true });
		//doc.save("statement.pdf");

        console.log(btoa(doc.output()));

        sendEmail({pdfBody: btoa(doc.output()),recordIdOfContact : this.recordId})
						.then(result => {
						})
						.catch(error => {
							console.log(error);
						});
    }

    handleEmailPDF()
    {
        this.generatePdfForEmail();

        const event = new ShowToastEvent({
            title: 'Email',
            message: 'PDF Genrated And sent to Contact Email address.',
            variant: 'success'
        });
        this.dispatchEvent(event);
    }

    handlePDF()
    {
		this.generatePdf();

        const event = new ShowToastEvent({
            title: 'PDF',
            message: 'PDF Genrated.',
            variant: 'success'
        });
        this.dispatchEvent(event);
    }

    createHeaders(keys) {
		var result = [];
		for (var i = 0; i < keys.length; i++) {
			result.push({
				id: keys[i],
				name: keys[i],
                AmountForPdf__c: keys[i],
                Transaction_Date__c: keys[i],
                Type__c: keys[i],
                Status__c: keys[i],
				width: 40,
				align: "center",
				padding: 0
			});
		}
		return result;
	}


    handleStartDate(event){
        this.StartDate  = event.target.value;     
    }

    handleEndDate(event){
        this.EndDate  = event.target.value;
    }

    handleDataTable(event){
        if(this.showTable === true)
        {
            this.showTableOnClick = true;
        }
    }

    //this method validates the data and creates the csv file to download
    handleCSV()
    {  
            let rowEnd = '\n';
            let csvString = '';
            // this set elminates the duplicates if have any duplicate keys
            let rowData = new Set();
    
            // getting keys from data
            this.data.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    rowData.add(key);
                });
            });
    
            // Array.from() method returns an Array object from any object with a length property or an iterable object.
            rowData = Array.from(rowData);
            
            // splitting using ','
            csvString += rowData.join(',');
            csvString += rowEnd;
            
    
            // main for loop to get the data based on key value
            for(let i=0; i < this.data.length; i++){
                let colValue = 0;
    
                // validating keys in data
                for(let key in rowData) {
                    if(rowData.hasOwnProperty(key)) {
                        // Key value 
                        // Ex: Id, Name
                        let rowKey = rowData[key];
                        // add , after every value except the first.
                        if(colValue > 0){
                            csvString += ',';
                        }
                        // If the column is undefined, it as blank in the CSV file.
                        let value = this.data[i][rowKey] === undefined ? '' : this.data[i][rowKey];
                        csvString += '"'+ value +'"';
                        colValue++;
                    }
                }
                csvString += rowEnd;
            }
    
            // Creating anchor element to download
            let downloadElement = document.createElement('a');
    
            // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
            downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);
            downloadElement.target = '_self';
            // CSV File Name
            downloadElement.download = 'Statement.csv';
            // below statement is required if you are using firefox browser
            document.body.appendChild(downloadElement);
            // click() Javascript function to download CSV file
            downloadElement.click();   
            
            const event = new ShowToastEvent({
                title: 'CSV',
                message: 'CSV Genrated',
                variant: 'success'
            });
            this.dispatchEvent(event);
    }
    
    get handleDisabled(){
        if(this.StartDate && this.EndDate)
        return false;
        else 
        return true;
    } 
    
    

    @wire(getStatement, {recordIdOfContact : '$recordId', statementStartDate : '$StartDate', statementEndDate : '$EndDate'}) 
    wiredTransactions({error,data})
    {
        console.log('WIRE');
        if(data)
        {
            if(data.length !=0)
                this.showTable = true;
            
            else
            {
               this.showTable = false;
               this.showTableOnClick = false;
            }

            console.log('item '+JSON.stringify(data));

            //this.data = data;

            this.item = data;


            console.log('This.Item '+ JSON.stringify(this.item));
            this.totalRecountCount = data.length; //here it is 23

            console.log('RecordCount '+this.totalRecountCount);

            this.data = this.item.slice(0,this.pageSize); 
            this.endingRecord = this.pageSize;

            //console.log('item '+JSON.stringify(this.items));
            //console.log('Slice '+JSON.stringify(this.items.slice(0,this.pageSize)));
            this.columns = columns;
        }
        else if (error) {
            this.error = error;
            this.data = undefined;
        }     
    }

    //clicking on previous button this method will be called
    handlePrevious() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    handleNext() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    handleFirst() {
        this.page = 1;
        this.displayRecordPerPage(this.page);
    }

    handleLast() {
        this.page = this.totalPage;
        this.displayRecordPerPage(this.page);
    }

    //DispalyMethod
    //this method displays records page by page
    displayRecordPerPage(page)
    {

        /*let's say for 2nd page
        page = 2; pageSize = 5; startingRecord = 5, endingRecord = 10
        so, slice(5,10) will give 5th to 9th records.
        */
        this.startingRecord = ((page -1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                            ? this.totalRecountCount : this.endingRecord; 

        this.data = this.item.slice(this.startingRecord, this.endingRecord);

        //increment by 1 to display the startingRecord count, 
        //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
        this.startingRecord = this.startingRecord + 1;
    } 
    
    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.data));

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };

        // cheking reverse direction 
        let isReverse = direction === 'asc' ? 1: -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.data = parseData;

    }  
}