import {
    LightningElement,
    api
} from 'lwc';

export default class Paginator extends LightningElement {
    
    @api totalrecords;
    @api currentpage;
    @api pagesize;

    // Following are the private properties to a class.  
    lastpage = false;
    firstpage = false;

    // getter  
    get showFirstButton() 
    {
        if (this.currentpage === 1)
        {
            return true;
        }
        return false;
    }
    // getter  
    get showLastButton() 
    {
        console.log('Total Record Count Paginator '+this.totalrecords);
        console.log('PageSize '+this.pagesize);
        console.log('Expression '+Math.ceil(this.totalrecords / this.pagesize));
        console.log('Current Page '+this.currentpage);

        if (Math.ceil(this.totalrecords / this.pagesize) === this.currentpage) 
        {
            return true;
        }
        return false;   
    }

    previousHandler() {
        this.dispatchEvent(new CustomEvent('previous'));
    }
    nextHandler() {
        this.dispatchEvent(new CustomEvent('next'));
    }

    firstHandler() {
        this.dispatchEvent(new CustomEvent('first'));
    }

    lastHandler() {
        this.dispatchEvent(new CustomEvent('last'));
    }
}