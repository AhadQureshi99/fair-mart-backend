class apierror extends Error{
    constructor(statuscode,message,errors=[]){
        super(message)
       this.errors=errors
       this.message=message
        this.statuscode=statuscode
    }
    }
    export{apierror}