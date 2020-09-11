const { makeSuccessResponse } = require('../utils/function');

module.exports = (app, upload) => {
  // 뷰 페이지 경로
  app.get('/show', (req, res) => {
    res.render('board');
  });

  app.post('/upload/image', upload.single('image'), (req, res) => {
    try {
      res.json({
        fileInfo: req.file,
        ...makeSuccessResponse('이미지 파일 업로드 성공'),
      });
    } catch (err) {
      res.status(500).send('서버 에러');
    }
  });
};
