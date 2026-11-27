/** The Unit 1 project: write your own rule, build it, and get a checklist from the grader. */
import { expect, test, type Page } from '@playwright/test';
import { addPart, connect, seedProgress } from './helpers';

async function openProject(page: Page) {
  await seedProgress(page, [
    'not-and/challenge',
    'or-xor/exactly-one',
    'circuit-to-table/challenge',
    'unit-1-project/brief',
  ]);
  await page.goto('#/lesson/unit-1-project/2');
}

const checklist = (page: Page) => page.getByTestId('project-result').locator('li');

test('the door alarm: finish the rule, build it, pass every item, then cut a wire', async ({
  page,
}, testInfo) => {
  await openProject(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Door alarm' })).toBeVisible();

  // The brief leaves two rows open: does panic work when the alarm is not set?
  await page.getByTestId('check-project').click();
  await expect(page.getByTestId('project-message')).toContainText('2 rows still need a 0 or 1');
  await page.getByTestId('rule-door-alarm-r2-o0-1').check(); // D=0, P=1, R=0
  await page.getByTestId('rule-door-alarm-r6-o0-1').check(); // D=1, P=1, R=0
  await expect(page.getByTestId('rule-door-alarm-count')).toHaveText('8 of 8 rows filled in');

  // L = P OR (D AND R)
  await addPart(page, testInfo, 'AND'); // and-1
  await addPart(page, testInfo, 'OR'); // or-1
  await connect(page, testInfo, ['D', 'out'], ['and-1', 'in0']);
  await connect(page, testInfo, ['R', 'out'], ['and-1', 'in1']);
  await connect(page, testInfo, ['and-1', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['P', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['L', 'in']);

  await page.getByTestId('check-project').click();
  await expect(checklist(page)).toHaveCount(5);
  await expect(checklist(page).filter({ hasText: 'Not yet:' })).toHaveCount(0);
  await expect(page.getByTestId('announcer')).toHaveText(
    'Project complete! Every item on the checklist is done.',
  );
  await expect(page.getByTestId('next-step')).toHaveText('Finish project ✔');

  // Cut the panic button's wire: the circuit no longer follows the rule.
  await page.locator('summary', { hasText: 'View and edit connections' }).click();
  await page.getByRole('button', { name: /^Remove wire Push button P/ }).click();
  await expect(page.getByTestId('project-result')).toHaveCount(0); // results were for the old circuit
  await page.getByTestId('check-project').click();
  await expect(checklist(page).filter({ hasText: 'Not yet:' })).toHaveCount(2);
  await expect(checklist(page).filter({ hasText: 'L never changes when P changes' })).toHaveCount(
    1,
  );
  await expect(page.getByTestId('next-step')).toBeVisible(); // a finished project stays finished

  // The rule and circuit are saved: after a reload, the same checklist.
  await page.reload();
  await expect(page.getByTestId('rule-door-alarm-count')).toHaveText('8 of 8 rows filled in');
  await page.getByTestId('check-project').click();
  await expect(checklist(page).filter({ hasText: 'Not yet:' })).toHaveCount(2);
  // The OR gate's loose input is unknown (X), so every row where D AND R is 0 is marked.
  await expect(page.locator('tr.is-wrong')).toHaveCount(6);

  // Changing the rule clears the old marks: they described the old rule.
  await page.getByTestId('rule-door-alarm-r2-o0-0').check();
  await expect(page.locator('tr.is-wrong')).toHaveCount(0);
  await expect(page.getByTestId('project-result')).toHaveCount(0);
});

test('the voting machine: a rule that ignores a judge is caught before building', async ({
  page,
}) => {
  await openProject(page);
  await page.getByTestId('brief-voting').check();
  await expect(page.getByRole('heading', { level: 2, name: 'Voting machine' })).toBeVisible();
  // Y = A: only judge A matters (rows 0-7 are A,B,C = 000 … 111).
  for (const r of [1, 2, 3]) await page.getByTestId(`rule-voting-r${r}-o0-0`).check();
  for (const r of [4, 5, 6]) await page.getByTestId(`rule-voting-r${r}-o0-1`).check();
  await expect(page.getByText('Your rule never uses B – should it matter?')).toBeVisible();

  // Each brief keeps its own work: back to the door alarm, which is still blank.
  await page.getByTestId('brief-door-alarm').check();
  await expect(page.getByTestId('rule-door-alarm-count')).toHaveText('6 of 8 rows filled in');
  await page.getByTestId('brief-voting').check();
  await expect(page.getByTestId('rule-voting-count')).toHaveText('8 of 8 rows filled in');
});
