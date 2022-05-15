import * as main from "../src/main";

const runMock = jest.spyOn(main, "default");

test("Runs main", async () => {
  await import("../src/index");
  expect(runMock).toBeCalled();
});
