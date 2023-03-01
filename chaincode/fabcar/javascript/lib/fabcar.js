/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const vehicle = [
            {
                chasaisNumber: 7298372,
                type:'car',
                make: 'Toyota',
                model: 'Prius',
                owner: 'Tomoko',
                vehicleNumber:'AP097568',
                ownerPhoneNumber:7823982894,
                address:'Guntur'
            },
            {
                chasaisNumber: 729823,
                type:'bike',
                make: 'yamaha',
                model: 'R-15',
                owner: 'Tomoko',
                vehicleNumber:'TN097556',
                ownerPhoneNumber:7839828456,
                address:'Chennai'
            },
            {
                chasaisNumber: 72372,
                type:'Lorry',
                make: 'Ashok Leyland',
                model: 'samart',
                owner: 'Tom',
                vehicleNumber:'KA097568',
                ownerPhoneNumber:78239865,
                address:'Bangalore'
            },
        ];

        const manufacturer=[
            {
                uid:8768,
                manufacturerName:'Anand Mahindra',
                companyName:'Mahindra private Limited',
                phoneNumber:4567890,
                Address:'pune'
            },
            {
                uid:8789,
                manufacturerName:'Ratan Tata',
                companyName:'Tata Motors',
                phoneNumber:4567,
                Address:'Mumbai'
            },
        ]

        for (let i = 0; i < vehicle.length; i++) {
            vehicle[i].docType = 'vehicle';
            await ctx.stub.putState('Vehicle' + i, Buffer.from(JSON.stringify(vehicle[i])));
            console.info('Added <--> ', vehicle[i]);
        }

        for (let i = 0; i < manufacturer.length; i++) {
            manufacturer[i].docType = 'manufacturer';
            await ctx.stub.putState('Manufacturer' + i, Buffer.from(JSON.stringify(manufacturer[i])));
            console.info('Added <--> ', manufacturer[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryVehicle(ctx, chasaisNumber) {
        const carAsBytes = await ctx.stub.getState(chasaisNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${chasaisNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }

    // async createCar(ctx, carNumber, make, model, color, owner) {
    //     console.info('============= START : Create Car ===========');

    //     const car = {
    //         color,
    //         docType: 'car',
    //         make,
    //         model,
    //         owner,
    //     };

    //     await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
    //     console.info('============= END : Create Car ===========');
    // }

    async vehicleExists(ctx, chasaisNumber) {
        const buffer = await ctx.stub.getState(chasaisNumber);
        return !!buffer && buffer.length > 0;
    }

    async manufacturerExists(ctx, manufacturerId) {
        const buffer = await ctx.stub.getState(manufacturerId);
        return !!buffer && buffer.length > 0;
    }

    async manufacturerRegistration(ctx, uid, manufacturerName, companyName, phoneNumber, Address) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID == "org1-vehicle-com") {
            const exists = await this.userExists(ctx, uid);
            if (exists) {
                throw new Error(`The manufacturer with id ${uid} already exists`);
            }
            const manufacturerDetails = {
                manufacturerName,
                companyName,
                docType:'manufacturer',
                phoneNumber,
                Address,
            };
            const buffer = Buffer.from(JSON.stringify(manufacturerDetails));
            await ctx.stub.putState(uid, buffer);
        }
    }

    async registerVehicle(ctx,chasaisNumber,type,make,model,owner,vehicleNumber,ownerPhoneNumber,address){
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID == "org2-vehicle-com") {
            const exists = await this.vehicleExists(ctx, chasaisNumber);
            if (exists) {
                throw new Error(
                    `The vehicle with number ${chasaisNumber} already exists`
                );
            }
        const vehicle = {
                    type,
                    docType: 'vehicle',
                    make,
                    model,
                    owner,
                    ownerPhoneNumber,
                    vehicleNumber,
                    address
                };
                await ctx.stub.putState(chasaisNumber, Buffer.from(JSON.stringify(vehicle)));
                console.info('============= END : Vehicle registration is completed ===========');
    }
}

async deleteVehicle(ctx, chasaisNumber) {
    const mspID = ctx.clientIdentity.getMSPID();
    if (mspID === "org2-vehicle-com") {
        const exists = await this.vehicleExists(ctx, chasaisNumber);
        if (!exists) {
            throw new Error(`The vehicle with ${chasaisNumber} does not exist`);
        }
        await ctx.stub.deleteState(chasaisNumber);
    } else {
        return `User under following MSP:${mspID} cannot able to perform this action`;
    }
}
async readvehicle(ctx, chasaisNumber) {
    const exists = await this.vehicleExists(ctx, chasaisNumber);
    if (!exists) {
        throw new Error(`The vehicle with ${chasaisNumber} does not exist`);
    }
    const buffer = await ctx.stub.getState(chasaisNumber);
    const asset = JSON.parse(buffer.toString());
    return asset;
}

    async queryAllVehicles(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changeVehicleOwner(ctx, chasaisNumber, newOwner,newOwneraddress,newOwnerPhoneNumber) {
        const mspID = ctx.clientIdentity.getMSPID();
        const asset1 = await this.readvehicle(ctx, chasaisNumber);
        const asset = JSON.parse(JSON.stringify(asset1));
        if (mspID == "org2-vehicle-com") {
            const asset2 = {
                owner: newOwner,
                docType: 'vehicle',
                type:asset.type,
                make: asset.make,
                ownerPhoneNumber:newOwnerPhoneNumber,
                vehicleNumber:asset.vehicleNumber,
                address:newOwneraddress
            };
            const buffer = Buffer.from(JSON.stringify(asset2));
            await ctx.stub.putState(chasaisNumber, buffer);
        }
    }
}


module.exports = FabCar;
