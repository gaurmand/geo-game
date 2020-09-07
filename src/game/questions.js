const d3 = require("d3");

const GeoData = require('./geodata');

class Question {
  constructor(country) {
    this.questionCountry = country;
    this.centroid = d3.geoCentroid(this.questionCountry);

    this.answered = false;
    this.answerCountry = null;
    this.answerLonLat = null;

    this.closesPoint = null;
    this.distanceToClosesPoint = 0;

    this.correctCountry = false;
    this.adjacentCountry = false;
    this.proximityScore = 0;
    this.adjacencyScore = 0;
    this.accuracyScore = 0;
    this.totalScore = 0;
  }

  answer(answerLonLat, answerCountry) {
    this.answered = true;
    this.answerCountry = answerCountry;
    this.answerLonLat = answerLonLat;

    if(!answerLonLat)
      return this.emptyAnswer();
    else if(!answerCountry)
      return this.oceanAnswer(this.answerLonLat, this.questionCountry);
    else
      return this.computeScore(this.answerLonLat, this.answerCountry, this.questionCountry);
  }

  emptyAnswer() {
    this.correctCountry = false;
    this.proximityScore = 0;
    this.accuracyScore = 0;
    this.adjacencyScore = 0;
    this.totalScore = 0;

    return this.getScore();
  }

  oceanAnswer(answerLonLat, questionCountry) {
    this.correctCountry = false;
    this.accuracyScore = 0;
    this.adjacencyScore = 0;

    let {
      closestPoint,
      distance
    } = Question.getClosestPointInCountry(answerLonLat, questionCountry.geometry);
    this.closesPoint = closestPoint;
    this.distanceToClosesPoint = distance;
    this.proximityScore = Question.computeProximityScoreExponential(distance);
    this.totalScore = this.proximityScore;

    return this.getScore();
  }

  computeScore(answerLonLat, answerCountry, questionCountry) {
    let {
      closestPoint,
      distance
    } = Question.getClosestPointInCountry(answerLonLat, questionCountry.geometry);
    this.closesPoint = closestPoint;
    this.distanceToClosesPoint = distance;

    if (GeoData.isSameCountry(answerCountry, questionCountry)) {
      //correct country clicked
      this.correctCountry = true;
      this.proximityScore = Question.MAX_PROXIMITY_SCORE;
      this.accuracyScore = Question.ACCURACY_BONUS;
      this.adjacencyScore = 0;
    } else {
      //incorrect country clicked
      this.proximityScore = Question.computeProximityScoreExponential(distance);
      this.adjacencyScore = (GeoData.isAdjacentCountry(answerCountry, questionCountry) ? Question.ADJACENCY_BONUS : 0);
      this.accuracyScore = 0;
    }
    this.totalScore = this.adjacencyScore + this.proximityScore + this.accuracyScore;

    return this.getScore();
  }

  getScore() {
    return {
      accuracy: this.accuracyScore,
      proximity: this.proximityScore,
      adjacency: this.adjacencyScore,
      total: this.totalScore
    };
  }

  getTotalScore() {
    return this.totalScore;
  }

  getCountryName() {
    return this.questionCountry.properties.NAME;
  }

  getCountryId() {
    return this.questionCountry.properties.NE_ID;
  }

  getQuestionCountry() {
    return this.questionCountry;
  }

  getAnswerCountry() {
    return this.answerCountry;
  }

  getAnswerCountryId() {
    return this.answerCountry.properties.NE_ID;
  }

  getCentroid() {
    return this.centroid;
  }

  isAnswered() {
    return this.answered;
  }

  isCorrect() {
    return this.correctCountry;
  }

  static getClosestPointInCountry(point, geometry) {
    switch (geometry.type) {
      case 'Polygon':
        return Question.getClosestPointInPolygon(point, geometry.coordinates[0]);
      case 'MultiPolygon':
        let closestDist = 2 * Math.PI;
        let closestPoint = null;

        geometry.coordinates.forEach(polygon => {
          let closest = Question.getClosestPointInPolygon(point, polygon[0]);
          if (closest.distance < closestDist) {
            closestDist = closest.distance;
            closestPoint = closest.point;
          }
        });

        return {
          point: closestPoint,
            distance: closestDist
        };
      default:
        throw 'unknown geomtery type';
    }
  }

  static getClosestPointInPolygon(point, polygon) {
    let closestDist = 2 * Math.PI;
    let closestPoint = null;

    polygon.forEach(polyPoint => {
      let dist = d3.geoDistance(point, polyPoint);
      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = polyPoint;
      }
    });

    return {
      point: closestPoint,
      distance: closestDist
    };
  }

  static computeProximityScoreLinear(dist) {
    //linear scoring function: score = m*d + b
    //m = -p'/pi, b = p'
    return Math.round(-Question.MAX_PROXIMITY_SCORE * (dist / Math.PI - 1));
  }

  static computeProximityScoreQuadratic(dist) {
    //quadratic scoring function: score = a*d^2 + b*d + c
    //a = p'(2-4s)/(pi^2), b = p`(4s-3)/(pi), c = p'

    const s = Question.QUADRATIC_PROXIMITY_SCALE_FACTOR;
    const p_max = Question.MAX_PROXIMITY_SCORE;
    const pi = Math.PI;
    const pi_sq = Math.pow(pi, 2);

    const a = p_max * (2 - 4 * s) / pi_sq;
    const b = p_max * (4 * s - 3) / pi;
    const c = p_max;

    let score = Math.round(a * dist * dist + b * dist + c)

    return (score < 0 ? 0 : score);
  }

  static computeProximityScoreExponential(dist) {
    //exponential scoring function: score = e^-(s1*d+s2)
    //s1 = (-ln(p0)-s2)/pi, s2 = -ln(p')

    const s2 = -Math.log(Question.MAX_PROXIMITY_SCORE);
    const s1 = -(Math.log(Question.EXPONENTIAL_PROXIMITY_SCALE_FACTOR) + s2) / Math.PI;

    return Math.round(Math.exp(-(s1 * dist + s2)));
  }

}

Question.MAX_SCORE = 120;

//Score for closest possible distance (d=0)
Question.MAX_PROXIMITY_SCORE = 100;

//Bonus if country is adjacent to target country
Question.ADJACENCY_BONUS = 5;

//Bonus if country is the target country
Question.ACCURACY_BONUS = 20;

//Score as proportion of maxmimum score (score=MAX_PROXIMITY_SCORE*PROXIMITY_SCORE_SCALE_FACTOR) at halfway to maximum distance (d=pi/2)
Question.QUADRATIC_PROXIMITY_SCALE_FACTOR = 1 / 20;

//Score at maximum distance (d=pi)
Question.EXPONENTIAL_PROXIMITY_SCALE_FACTOR = 0.1;


class QuestionSet {
  constructor(numQuestions = QuestionSet.DEFAULT_NUM_QUESTIONS) {
    this.numQuestions = numQuestions;
    this.questionCountries = GeoData.getRandomCountries(numQuestions);
    this.questions = [];
    this.questionCountries.forEach(country => {
      this.questions.push(new Question(country));
    });
  }

  getQuestion(i) {
    return this.questions[i];
  }

  getNumQuestions() {
    return this.numQuestions;
  }

  isAnswered() {
    this.questions.forEach(question => {
      if (!question.isAnswered())
        return false;
    });
    return true;
  }

  getTotalScore() {
    let total = 0;
    this.questions.forEach(question => total += question.totalScore);
    return total;
  }

  forEach(cb) {
    this.questions.forEach((question, i, arr) => cb(question, i, arr));
  }
}
QuestionSet.DEFAULT_NUM_QUESTIONS = 10;

module.exports = {
  Question, 
  QuestionSet
};