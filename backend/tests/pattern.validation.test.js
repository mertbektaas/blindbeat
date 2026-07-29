const { validateDrumPattern,
        validateMelodicPattern,
        validatePattern
 } = require("../src/validation/pattern.schemas");

test("gecerli davul true donmeli", () => {
    const pattern = {
    version: 1,
    instrumentType: "drums",
    stepCount: 2,
    data: {
      steps: [
        {
          kick: true,
          snare: false,
          hiHat: true
        },
        {
          kick: false,
          snare: true,
          hiHat: true
        }
      ]
    }
};
const result = validateDrumPattern(pattern);
expect(result.valid).toBe(true);
});

test("stepCount ve steps uzunlugu uyusmali", () => {
    const pattern = {
    version: 1,
    instrumentType: "drums",
    stepCount: 3,
    data: {
      steps: [
        {
          kick: true,
          snare: false,
          hiHat: true
        },
        {
          kick: false,
          snare: true,
          hiHat: true
        }
      ]
    }
};
const result = validateDrumPattern(pattern);
expect(result.valid).toBe(false);
});

test("gecerli melodi true donmeli", () =>{
    const pattern = {
        version: 1,
        instrumentType: "bass",
        stepCount: 2,
        data: {
            steps: [
                null,
                {
                    note: "C3",
                    velocity: 0.8
                }
            ]
        }
    };
    const result = validateMelodicPattern(pattern);
    expect(result.valid).toBe(true);
});

test("gecersiz melodik pattern reddedilir", () =>{
    const pattern = {
        version: 1,
        instrumentType: "bass",
        stepCount: 2,
        data: {
            steps: [
                null,
                {
                    note: "C3",
                    velocity: 1.5
                }
            ]
        }
    };
    const result = validateMelodicPattern(pattern);
    expect(result.valid).toBe(false);
});

test("gecersiz nota formati reddedilir", () => {
    const pattern = {
        version: 1,
        instrumentType: "bass",
        stepCount: 1,
        data: {
            steps: [
                {
                    note: "x1",
                    velocity: 0.8
                }
            ]
        }
    };

    const result = validateMelodicPattern(pattern);
    expect(result.valid).toBe(false);
});

test("dogru instrument type kabul edilir", () =>{
    const pattern ={
        version: 1,
        instrumentType: "bass",
        stepCount: 2,
        data:{
            steps: [
                null,
                {
                    note: "C3",
                    velocity: 0.3
                }
            ]
        }
    };

    const result = validatePattern(pattern);
    expect(result.valid).toBe(true);
});

test("yanlis instrument type reddedilir", () =>{
    const pattern ={
        version: 1,
        instrumentType: "unknown-instrument",
        stepCount: 2,
        data:{
            steps: [
                null,
                {
                    note: "C3",
                    velocity: 0.3
                }
            ]
        }
    };

    const result = validatePattern(pattern);
    expect(result.valid).toBe(false);
});
