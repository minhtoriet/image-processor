// JSON Input Validation rules (instead of Data Annotations)
import Type from 'typebox';

export const uploadSchema = {
    body : {
        type : 'object',
        required : ['imageName'],
        properties : {
            imageName : {type : 'string', minLength : 3}
        }
    },
    response: {
        202: {
            type: 'object',
            properties: {
                success: {type: 'boolean'},
                jobId: {type: 'string'}
            }
        },
        500: {
            type:'object',
            properties:{
                success:{type:false},
                content:'interal server error'
            }
        }
    }
};