import { NextResponse } from 'next/server'

export async function GET() {
  const companies = [
    { id: 1, name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', industry: 'Technology', color: '#4285f4' },
    { id: 2, name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', industry: 'Software', color: '#0078d4' },
    { id: 3, name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', industry: 'E-Commerce', color: '#ff9900' },
    { id: 4, name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', industry: 'Social Media', color: '#0668e1' },
    { id: 5, name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', industry: 'Technology', color: '#000000' },
    { id: 6, name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', industry: 'Entertainment', color: '#e50914' },
    { id: 7, name: 'Tesla', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg', industry: 'Automotive', color: '#cc0000' },
    { id: 8, name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.svg', industry: 'Software', color: '#ff0000' },
    { id: 9, name: 'Salesforce', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg', industry: 'Cloud Computing', color: '#00a1e0' },
    { id: 10, name: 'Oracle', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', industry: 'Database', color: '#f80000' },
    { id: 11, name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', industry: 'Technology', color: '#0f62fe' },
    { id: 12, name: 'Intel', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg', industry: 'Semiconductors', color: '#0071c5' },
    { id: 13, name: 'NVIDIA', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg', industry: 'Graphics', color: '#76b900' },
    { id: 14, name: 'Goldman Sachs', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg', industry: 'Finance', color: '#0d47a1' },
    { id: 15, name: 'Morgan Stanley', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Morgan_Stanley_Logo_1.svg', industry: 'Finance', color: '#00aeef' },
    { id: 16, name: 'Uber', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png', industry: 'Transportation', color: '#000000' },
    { id: 17, name: 'Airbnb', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg', industry: 'Hospitality', color: '#ff5a5f' },
    { id: 18, name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', industry: 'Music', color: '#1db954' },
    { id: 19, name: 'LinkedIn', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png', industry: 'Professional Network', color: '#0077b5' },
    { id: 20, name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', industry: 'IT Services', color: '#007cc3' },
  ]

  return NextResponse.json({ companies })
}
