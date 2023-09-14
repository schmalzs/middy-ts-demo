import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const middleware = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: (request) => {
      console.log('before middleware');
    },
    after: (request) => {
      console.log('after middleware');
    },
    onError: (request) => {
      console.log('onError middleware');
    },
  };
};

export default middleware;
