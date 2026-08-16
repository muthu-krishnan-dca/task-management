import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, TaskPriority, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

 async onModuleInit() {
  await this.seedInitialTasks();

  setInterval(() => this.check10MinTaskReminders(), 30000);
}

  private async check10MinTaskReminders() {
    try {
      const now = new Date();
      const upcomingTasks = await this.taskModel.find({
        status: { $ne: TaskStatus.COMPLETED },
      }).exec();

      for (const task of upcomingTasks) {
        if (!task.dueDate) continue;
        const dueTimeStr = task.dueTime || '10:00 AM';
        const taskDueDate = new Date(`${task.dueDate} ${dueTimeStr}`);

        if (isNaN(taskDueDate.getTime())) continue;

        const diffMs = taskDueDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        // If task is starting or due within 10 minutes (between 0 and 10 mins)
        if (diffMins >= 0 && diffMins <= 10) {
          this.notificationsGateway.broadcastNotification({
            id: `reminder-10m-${task.id || task._id}-${diffMins}`,
            title: `⏰ Task Starting Soon (10 Mins)!`,
            message: `Task "${task.title}" is scheduled to start in ${diffMins === 0 ? 'less than a minute' : diffMins + ' minutes'}!`,
            type: 'warning',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            task,
          });
        }
      }
    } catch {
      // Ignore background scan errors
    }
  }

  private async seedInitialTasks() {
    try {
      const count = await this.taskModel.countDocuments();
      if (count === 0) {
        const initialTasks = [
          {
            title: 'Design Landing Page',
            description: 'Responsive landing page design matching Figma specs',
            project: 'Website Redesign',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: '2025-05-20',
            dueTime: '10:00 AM',
            estimatedTime: '2 hours',
          },
          {
            title: 'Fix Navbar Issues',
            description: 'Resolve mobile responsive layout and z-index issues',
            project: 'Website Redesign',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: '2025-05-22',
            dueTime: '02:30 PM',
            estimatedTime: '1 hour',
          },
          {
            title: 'API Integration',
            description: 'Connect REST endpoints with backend services',
            project: 'Mobile App',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: '2025-05-18',
            dueTime: '11:15 AM',
            estimatedTime: '3 hours',
          },
          {
            title: 'Database Setup',
            description: 'Configure MongoDB schemas and database connections',
            project: 'Mobile App',
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            dueDate: '2025-05-25',
            dueTime: '04:00 PM',
            estimatedTime: '1 hour',
          },
          {
            title: 'User Authentication',
            description: 'Implement JWT login authentication and session tokens',
            project: 'Mobile App',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: '2025-05-21',
            dueTime: '09:00 AM',
            estimatedTime: '4 hours',
          },
          {
            title: 'Write Documentation',
            description: 'Create API documentation and user guide',
            project: 'Website Redesign',
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            dueDate: '2025-05-30',
            dueTime: '05:00 PM',
            estimatedTime: '2 hours',
          },
          {
            title: 'Testing & Bug Fixes',
            description: 'Perform cross-browser testing and bug fixes',
            project: 'Mobile App',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: '2025-05-28',
            dueTime: '01:00 PM',
            estimatedTime: '3 hours',
          },
        ];
        await this.taskModel.insertMany(initialTasks);
      }
    } catch (error) {
      console.warn('MongoDB Seeding Notice:', error?.message || error);
    }
  }

  async findAll(search?: string, status?: string, priority?: string): Promise<Task[]> {
    const filter: any = {};

    if (status) {
      filter.status = new RegExp(`^${status}$`, 'i');
    }

    if (priority) {
      filter.priority = new RegExp(`^${priority}$`, 'i');
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Task> {
    try {
      const task = await this.taskModel.findById(id).exec();
      if (!task) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const newTask = new this.taskModel({
      title: createTaskDto.title,
      description: createTaskDto.description || '',
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
      dueDate: createTaskDto.dueDate || undefined,
      dueTime: createTaskDto.dueTime || undefined,
      estimatedTime: createTaskDto.estimatedTime || undefined,
      project: createTaskDto.project || 'Website Redesign',
    });
    const savedTask = await newTask.save();
    this.notificationsGateway.notifyTaskCreated(savedTask);
    return savedTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      const updatedTask = await this.taskModel
        .findByIdAndUpdate(id, { $set: updateTaskDto }, { returnDocument: 'after' })
        .exec();
      if (!updatedTask) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      this.notificationsGateway.notifyTaskUpdated(updatedTask);
      return updatedTask;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    try {
      const deleted = await this.taskModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      this.notificationsGateway.notifyTaskDeleted(id);
      return { success: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }
}