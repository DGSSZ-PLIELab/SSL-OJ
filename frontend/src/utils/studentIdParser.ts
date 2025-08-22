/**
 * 学号解析工具
 * 学号格式：1503241123
 * - 1503: 学校代码
 * - 24: 入学年份（2024年入学）
 * - 11: 班级号
 * - 23: 学生序号
 */

export interface StudentInfo {
  grade: string
  class: string
  isValid: boolean
  error?: string
}

/**
 * 解析学号获取年级和班级信息
 * @param studentId 学号
 * @returns 学生信息
 */
export function parseStudentId(studentId: string): StudentInfo {
  // 验证学号格式
  if (!studentId || studentId.length !== 10) {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '学号必须为10位数字'
    }
  }

  // 验证是否全为数字
  if (!/^\d{10}$/.test(studentId)) {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '学号只能包含数字'
    }
  }

  // 验证学校代码
  const schoolCode = studentId.substring(0, 4)
  if (schoolCode !== '1503') {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '学校代码不正确'
    }
  }

  // 解析入学年份
  const enrollmentYear = parseInt(studentId.substring(4, 6))
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // 计算实际入学年份（20xx年）
  const fullEnrollmentYear = 2000 + enrollmentYear
  
  // 验证入学年份是否合理（不能超过当前年份，不能太早）
  if (fullEnrollmentYear > currentYear || fullEnrollmentYear < currentYear - 10) {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '入学年份不合理'
    }
  }

  // 计算当前年级
  let yearsInSchool = currentYear - fullEnrollmentYear
  
  // 如果当前月份小于9月（新学年开始），则年级减1
  if (currentMonth < 9) {
    yearsInSchool -= 1
  }

  // 验证年级范围（高中1-3年级）
  if (yearsInSchool < 0 || yearsInSchool > 2) {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '该学号对应的学生已毕业或尚未入学'
    }
  }

  // 解析班级号
  const classNumber = parseInt(studentId.substring(6, 8))
  
  // 验证班级号范围（1-18班）
  if (classNumber < 1 || classNumber > 18) {
    return {
      grade: '',
      class: '',
      isValid: false,
      error: '班级号必须在1-18之间'
    }
  }

  // 生成年级和班级字符串
  const gradeNames = ['高一', '高二', '高三']
  const grade = gradeNames[yearsInSchool]
  const className = `${grade}(${classNumber})班`

  return {
    grade,
    class: className,
    isValid: true
  }
}

/**
 * 验证学号格式
 * @param studentId 学号
 * @returns 是否有效
 */
export function validateStudentId(studentId: string): boolean {
  return parseStudentId(studentId).isValid
}

/**
 * 获取学号错误信息
 * @param studentId 学号
 * @returns 错误信息
 */
export function getStudentIdError(studentId: string): string | undefined {
  return parseStudentId(studentId).error
}