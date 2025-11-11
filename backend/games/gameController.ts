import {WebSocketServer} from 'ws';

const WSPORT = 8081;

const initiateWss = () => {
  const wss = new WebSocketServer({ port: WSPORT });

  return wss;
};

export {
  initiateWss,
};