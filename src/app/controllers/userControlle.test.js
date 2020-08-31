const request = require('supertest');

const app = require('../../../config/express')();

describe('userController', () => {
  describe('POST /user', () => {
    context('if send correct datas', () => {
      it('inserts userdata into user table', async (done) => {
        // const response = await request(app)
        //   .post('/user')
        //   .send({ email: '1@1.com', name: '2', password: '3' });
        // expect(response.status).toBe(200);
        // expect(response.body.code).toBe(200);
        // done();

        request(app)
          .post('/user')
          .send({ email: 'user@example.com', name: 'kane', password: '123456789' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.code).toBe(200);
            console.log(res.type, res.text, res.body);
            return done();
          });
      });
    });
  });
});
