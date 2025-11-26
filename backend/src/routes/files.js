const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { Project, ProjectFile, User } = require('../models');
const upload = require('../middleware/upload');
const { logActivity } = require('../services/activityLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Управление файлами проектов
 */

/**
 * @swagger
 * /api/files/project/{projectId}:
 *   post:
 *     summary: Загрузить файл для проекта
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID проекта
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Файл успешно загружен
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Проект не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  '/upload/:projectId',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не был загружен' });
      }

      const { projectId } = req.params;
      const project = await Project.findByPk(projectId);

      if (!project) {
        // Удаляем загруженный файл, если проект не найден
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Проект не найден' });
      }

      // Проверяем права доступа: владелец, участник проекта, преподаватель или администратор
      const isOwner = project.ownerId === req.user.id;
      const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
      
      // Проверяем, является ли пользователь участником проекта
      let isMember = false;
      if (!isOwner && !isTeacherOrAdmin) {
        const projectWithMembers = await Project.findByPk(project.id, {
          include: [{
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        });
        if (projectWithMembers && projectWithMembers.members) {
          isMember = projectWithMembers.members.some(member => member.id === req.user.id);
        }
      }
      
      if (!isOwner && !isTeacherOrAdmin && !isMember) {
        // Удаляем загруженный файл, если нет доступа
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, участник проекта или преподаватель могут загружать файлы.' });
      }

      const file = await ProjectFile.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`, // Сохраняем относительный путь для фронтенда
        projectId: project.id,
        uploadedBy: req.user.id
      });

      await logActivity({
        type: 'file_uploaded',
        description: `Файл "${file.originalName}" загружен для проекта "${project.title}"`,
        userId: req.user.id,
        projectId: project.id,
        metadata: { fileName: file.originalName, fileSize: file.size }
      });

      const fileWithUploader = await ProjectFile.findByPk(file.id, {
        include: [{ model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] }]
      });

      res.status(201).json(fileWithUploader);
    } catch (error) {
      // Удаляем загруженный файл в случае ошибки
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Ошибка при загрузке файла', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/files/project/{projectId}:
 *   get:
 *     summary: Получить все файлы проекта
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Список файлов
 *       404:
 *         description: Проект не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверка доступа
    const { hasProjectAccess } = require('../utils/accessControl');
    const hasAccess = await hasProjectAccess(project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для просмотра файлов этого проекта.' });
    }

    const files = await ProjectFile.findAll({
      where: { projectId },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Ошибка при получении файлов', error: error.message });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Скачать файл
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID файла
 *     responses:
 *       200:
 *         description: Файл
 *       404:
 *         description: Файл не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const file = await ProjectFile.findByPk(id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!file) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    // Проверка доступа
    const { hasProjectAccess } = require('../utils/accessControl');
    const hasAccess = await hasProjectAccess(file.project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для скачивания файлов этого проекта.' });
    }

    // Преобразуем относительный путь в абсолютный
    const filePath = file.path.startsWith('/uploads/') 
      ? path.join(__dirname, '../../uploads', path.basename(file.path))
      : path.join(__dirname, '../../uploads', file.path);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'Файл не найден на сервере' });
    }

    // Устанавливаем правильные заголовки для скачивания
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    
    // Отправляем файл
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Ошибка при отправке файла', error: err.message });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Ошибка при скачивании файла', error: error.message });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Удалить файл
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID файла
 *     responses:
 *       204:
 *         description: Файл успешно удален
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Файл не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const file = await ProjectFile.findByPk(id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!file) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    // Проверка прав доступа: загрузивший файл, владелец проекта, участник проекта, преподаватель или администратор
    const isUploader = file.uploadedBy === req.user.id;
    const isOwner = file.project.ownerId === req.user.id;
    const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
    
    // Проверяем, является ли пользователь участником проекта
    let isMember = false;
    if (!isUploader && !isOwner && !isTeacherOrAdmin) {
      const projectWithMembers = await Project.findByPk(file.project.id, {
        include: [{
          model: User,
          as: 'members',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      });
      if (projectWithMembers && projectWithMembers.members) {
        isMember = projectWithMembers.members.some(member => member.id === req.user.id);
      }
    }
    
    if (!isUploader && !isOwner && !isTeacherOrAdmin && !isMember) {
      return res.status(403).json({ message: 'Доступ запрещен. Только загрузивший файл, владелец проекта, участник проекта или преподаватель могут удалять файлы.' });
    }

    // Удаляем файл с диска
    const filePath = file.path.startsWith('/uploads/') 
      ? path.join(__dirname, '../../uploads', path.basename(file.path))
      : file.path;
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await logActivity({
      type: 'file_deleted',
      description: `Файл "${file.originalName}" удален из проекта "${file.project.title}"`,
      userId: req.user.id,
      projectId: file.project.id,
      metadata: { fileName: file.originalName }
    });

    await file.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Ошибка при удалении файла', error: error.message });
  }
});

module.exports = router;

