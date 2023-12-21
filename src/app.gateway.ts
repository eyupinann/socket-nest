import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  activeUsers: Record<string, string> = {}; // { socketID: username }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);

    const storedUsername = args[0]?.username || 'Unknown';

    this.activeUsers[client.id] = storedUsername;


    this.server.emit('activeUsers');
    this.server.emit('newUser', { username: storedUsername, socketID: client.id });
  }


  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);

    delete this.activeUsers[client.id];

    this.server.emit('activeUsers', this.activeUsers);
  }

  @SubscribeMessage('getActiveUsers')
  getActiveUsers(client: any) {
    client.emit('activeUsers', this.activeUsers);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: { username: string; message: string }): void {
    this.server.emit('message', message);
  }

  @SubscribeMessage('newUser')
  HandleNewUser(@MessageBody() data: { username: string, socketID: string }): void {
    console.log('New User:', data);
    this.activeUsers[data.socketID] = data.username;
    this.server.emit('activeUsers', this.activeUsers);
    this.server.emit('newUser', {
      username: data.username,
      socketID: data.socketID,
    });
  }
}
