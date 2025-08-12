export namespace services {
	
	export class CreatePasswordRequest {
	    serviceName: string;
	    username: string;
	    password: string;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new CreatePasswordRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serviceName = source["serviceName"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.notes = source["notes"];
	    }
	}
	export class PasswordEntryResponse {
	    id: number;
	    serviceName: string;
	    username: string;
	    notes: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new PasswordEntryResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.serviceName = source["serviceName"];
	        this.username = source["username"];
	        this.notes = source["notes"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}

}

