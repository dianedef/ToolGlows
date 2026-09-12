export const useTestStore = defineStore('test', () => {
  const { data: count } = useBrowserLocalStorage('toolglowsTestCount', 0)
  const { data: name } = useBrowserLocalStorage('toolglowsTestName', 'John Doe')

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  return {
    count,
    name,
    increment,
    decrement,
  }
})
