const key = 'epavone-writer-student-default';
export const studentDefaults = {
  read() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return typeof value?.student === 'string' && typeof value?.room === 'string' ? value : null;
    } catch {
      return null;
    }
  },
  save(value) {
    localStorage.setItem(key, JSON.stringify({ student: value.student, room: value.room }));
  },
  remove() {
    localStorage.removeItem(key);
  }
};
