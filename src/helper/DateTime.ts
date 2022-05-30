const DateTime = () => {
  const month = (index: number) => {
    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]
    return bulan[index]
  }
  return { month }
}

export default DateTime()
