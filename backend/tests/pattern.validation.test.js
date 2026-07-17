const { validateDrumPattern } = require("../src/validation/pattern.schemas");

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