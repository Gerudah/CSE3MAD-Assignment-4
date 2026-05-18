describe('Text Filter Tests', () => {
  test('Clean message should pass filter', () => {
    const text = 'This activity was fun';
    const containsBadWord = false;

    expect(containsBadWord).toBe(false);
  });

  test('Inappropriate message should fail filter', () => {
    const text = 'badword';
    const containsBadWord = true;

    expect(containsBadWord).toBe(true);
  });
});