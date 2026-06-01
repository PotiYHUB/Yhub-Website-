/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HubItem, MediaItem, Room, CustomQuestion, Booking } from './types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: '1',
    name: 'მედია და პოდკასტ ლაბორატორია',
    description: 'აღჭურვილია პროფესიონალური მიკროფონებით, ხმის საიზოლაციო კედლებით, მწვანე ეკრანით (Green Screen) და ვიდეო მონტაჟისთვის განკუთვნილი მძლავრი კომპიუტერებით. იდეალურია პოდკასტების ჩასაწერად და ციფრული კონტენტის შესაქმნელად.',
    capacity: 10,
    price: 15,
    dayPrice: 100,
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['ხმის იზოლაცია', '4 პროფესიონალური მიკროფონი', 'მწვანე ეკრანი (Green Screen)', '4K ვიდეო კამერა', 'მონტაჟის კომპიუტერი'],
    panoramaUrl: 'https://cdn.pannellum.org/2.5/pannellum.htm?panorama=https://pannellum.org/images/alma.jpg&autoLoad=true',
    videoUrl: 'https://www.youtube.com/embed/YpS89d8k1q0'
  },
  {
    id: '2',
    name: 'კოლაბორაციული Hub / Co-working სივრცე',
    description: 'ღია, ნათელი და კომფორტული სამუშაო სივრცე, რომელიც იდეალურია გუნდური პროექტებისთვის, კრეატიული იდეების გასაზიარებლად, ინდივიდუალური მუშაობისა და დისკუსიებისთვის.',
    capacity: 25,
    price: 30,
    dayPrice: 200,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['მაღალსისწრაფო WiFi', 'პროექტორი და მოძრავი ეკრანი', 'დიდი თეთრი დაფა (Whiteboard)', 'ჩაი/ყავის კუთხე', 'ერგონომიული ავეჯი'],
    panoramaUrl: 'https://cdn.pannellum.org/2.5/pannellum.htm?panorama=https://pannellum.org/images/cerro-tolo-lo.jpg&autoLoad=true',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '3',
    name: 'საპრეზენტაციო და საკონფერენციო დარბაზი',
    description: 'დიდი დარბაზი, რომელიც განკუთვნილია სემინარების, პრეზენტაციების, ფილმების ჩვენებისა და ფორუმების ჩასატარებლად. სკამები მარტივად ტრანსფორმირებადია ღონისძიების საჭიროებისამებრ.',
    capacity: 50,
    price: 60,
    dayPrice: 400,
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['50 ტრანსფორმირებადი სკამი', 'Lazer 4K პროექტორი', 'ჩაშენებული აუდიო სისტემა', '2 ცალი უკაბელო მიკროფონი', 'კლიმატკონტროლი']
  },
  {
    id: '4',
    name: 'ტექნოლოგიებისა და რობოტოტექნიკის კლასი',
    description: 'ინოვაციური ლაბორატორია ახალგაზრდებისთვის, ვინც დაინტერესებულია ინჟინერიით, პროგრამირებითა და რობოტიკით. სივრცეში დაგხვდებათ Arduino ნაკრებები, 3D პრინტერები და ელექტრონიკის ხელსაწყოები.',
    capacity: 15,
    price: 25,
    dayPrice: 170,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['3D პრინტერი FlashForge', 'Arduino-ს და Raspberry Pi-ს ბლოკები', 'სარჩილავი სადგურები', 'LCD ოსცილოგრაფი', 'სამუშაო ხელსაწყოები']
  }
];

export const INITIAL_HUB_ITEMS: HubItem[] = [
  {
    id: 'h1',
    category: 'news',
    title: 'ფოთის იდეების ჰაკათონი „ეკო-ტექ 2026“ საზეიმოდ გაიხსნა!',
    summary: 'ფოთში, ახალგაზრდულ ჰაბში სტარტი აიღო 48-საათიანმა ჰაკათონმა, რომლის მიზანია ტექნოლოგიური გადაწყვეტილებების შექმნა ქალაქის ეკოლოგიური პრობლემების გადასაჭრელად.',
    content: 'ქალაქ ფოთის ახალგაზრდულ ჰაბში კრეატიული ენერგია დუღს! გაიხსნა 48-საათიანი ჰაკათონი, სადაც 12 ახალგაზრდული გუნდი ერთმანეთს ეჯიბრება ჭკვიანი და მწვანე ტექნოლოგიური პროტოტიპების შექმნაში. \n\nპროექტები ფოკუსირებულია შავი ზღვის სანაპირო ზოლის დასუფთავებაზე, კოლხეთის ეროვნული პარკის ბიომრავალფეროვნების მონიტორინგსა და პორტის მიმდებარე ტერიტორიებზე ჰაერის ხარისხის თვითმმართველ და ხაზგარეშე გაზომვებზე. გამარჯვებული გუნდები მიიღებენ ფულად ჯილდოსა და დაფინანსებას საკუთარი სტარტაპ იდეის რეალობად გადასაქცევად.',
    date: '2026-05-20',
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'h2',
    category: 'news',
    title: 'კინოჩვენება და დისკუსია კალიგრაფიულ კულტურაზე',
    summary: 'პარასკევს, საპრეზენტაციო დარბაზში გაიმართა ქართული კალიგრაფიის ისტორიის შესახებ ფილმის ჩვენება და შეხვედრა ქართველ კალიგრაფებთან.',
    content: 'ჰაბის კინოკლუბის ფარგლებში გაიმართა შემეცნებითი შეხვედრა. ახალგაზრდებმა მოისმინეს ლექცია ქართული ანბანის სამივე სახეობის ევოლუციის შესახებ, რის შემდეგაც თავად სცადეს ძველებური მელნითა და სპეციალური კალმებით ქაღალდზე ორნამენტების გამოხატვა. ღონისძიებას 30-ზე მეტი დაინტერესებული ახალგაზრდა დაესწრო.',
    date: '2026-05-18',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'h3',
    category: 'training',
    title: 'ვებ-პროგრამირების საფუძვლები React და Tailwind-ით',
    summary: 'უფასო 3-თვიანი ინტენსიური სასწავლო პროგრამა ფოთელი ახალგაზრდებისთვის. ისწავლეთ თანამედროვე ვებ-ფრონტენდ ტექნოლოგიები ნულიდან.',
    content: 'გსურს შექმნა თანამედროვე ვებ-აპლიკაციები და შემოუერთდე გლობალურ ყოველდღიურად მზარდ ინდუსტრიას? ფოთის ახალგაზრდული ჰაბი იწყებს უფასო სასერტიფიკატო კურსს React ებისა და Tailwind CSS-ის შესასწავლად.\n\nკურსის განმავლობაში შეისწავლით:\n• HTML5, CSS3 და თანამედროვე JavaScript-ის (ES6+) საძირკვლებს\n• React-ის არქიტექტურას, Hook-ებსა და მდგომარეობის მართვას\n• მობილურზე ადაპტირებადი დიზაინების აწყობას Tailwind CSS-ის გამოყენებით\n\nკურსი მოიცავს როგორც თეორიულ, ისე პრაქტიკულ რესურსებს და დასრულდება რეალური გამოსაშვები პროექტის პრეზენტაციით.',
    date: '2026-05-15',
    coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    deadline: '2026-06-05',
    location: 'ჰაბის ტექნოლოგიების კლასი / ონლაინ ჰიბრიდული',
    requirements: ['ასაკი: 15-29 წელი', 'საბაზისო კომპიუტერული უნარები', 'ინგლისური ენის მინიმალური A2 დონე მასალის გასაგებად'],
    trainingButtonText: 'დაიწყე სწავლა ახლავე',
    trainingButtonLink: 'https://example.com/apply-react-course'
  },
  {
    id: 'h4',
    category: 'training',
    title: 'პოდკასტების მომზადება და ციფრული მედია-წიგნიერება',
    summary: 'პრაქტიკული ვორქშოპი მათთვის, ვისაც სურს საკუთარი ხმის გაჟღერება, აუდიო-ვიდეო მონტაჟი და პოდკასტის გაშვება Spotify-ზე.',
    content: 'ისწავლე როგორ დაწერო საინტერესო სკრიპტი პოდკასტისთვის, მართო გადამღები და ჩამწერი აპარატურა, ჩაწერო სუფთა ხმა ჩვენს მედია ლაბორატორიაში და დაამონტაჟო ეპიზოდები. ტრენინგს გაუძღვებიან მოწვეული მედია ექსპერტები.\n\nსესიები იქნება 100% ინტერაქციული და პრაქტიკული. მონაწილეები შექმნიან საკუთარ მიკრო-პოდკასტ საპილოტე ეპიზოდებს ადგილობრივ პრობლემატიკებზე.',
    date: '2026-05-12',
    coverImage: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    deadline: '2026-06-01',
    location: 'მედია და პოდკასტ ლაბორატორია',
    requirements: ['ფოთში მცხოვრები ახალგაზრდები', 'საკუთარი იდეების პრეზენტაციის სურვილი', 'რეგისტრაციის ფორმის შევსება'],
    trainingButtonText: 'შეუკვეთე უფასო კონსულტაცია',
    trainingButtonLink: 'https://example.com/podcast-consultation'
  },
  {
    id: 'h5',
    category: 'contest',
    title: 'ფოტოკონკურსი „ფოთი - კოლხური ზღაპრისა და ზღვის კარიბჭე“',
    summary: 'გამოავლინე შენი ფოტოგრაფიული ნიჭი! გადაიღე ფოთის გამორჩეული ხედები, პორტი, კოლხეთის ჭაობები ან ქალაქური ცხოვრების კადრები.',
    content: 'ახალგაზრდული ჰაბი აცხადებს ყოველწლიურ ფოტოკონკურსს ახალგაზრდა მოყვარული ფოტოგრაფებისთვის. \n\nკონკურსის ნომინაციები:\n• „ინდუსტრიული ფოთი“ (პორტი, გემები და შუქურა)\n• „კოლხეთის მწვანე მემკვიდრეობა“ (ბუნება, ჭაობები, ტბები)\n• „სახეები და ემოციები“ (ფოთელი ადამიანები)\n\nჟიური გამოავლენს 3 გამარჯვებულს, ხოლო 20 საუკეთესო ნამუშევარი გამოიფინება ახალგაზრდული ჰაბის გალერეაში და გაიყიდება საქველმოქმედო აუქციონზე, საიდანაც შემოსული თანხა მოხმარდება ქალაქში სოციალურად დაუცველი მოხუცების მხარდაჭერას.',
    date: '2026-05-10',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    deadline: '2026-06-15',
    location: 'ფოთის ირგვლივ / ფინალი ჰაბის საგამოფენო სივრცეში',
    requirements: ['ასაკი: 12-25 წელი', 'ფოტო უნდა იყოს გადაღებული ფოთის მუნიციპალიტეტის ფარგლებში', 'დასაშვებია როგორც პროფესიონალური კამერით, ისე მობილურით გადაღებული კადრები']
  }
];

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'm1',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1523908503901-507a37956382?auto=format&fit=crop&w=800&q=80',
    caption: 'ახალგაზრდების შეხვედრა Co-working სივრცეში იდეების გენერირებისთვის',
    date: '2026-05-19'
  },
  {
    id: 'm2',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    caption: 'ტექნოლოგიური სემინარი და პროტოტიპების განხილვები საპრეზენტაციო დარბაზში',
    date: '2026-05-15'
  },
  {
    id: 'm3',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
    caption: 'პროგრამირების გაკვეთილი კოდინგის ახალი ნაკადისთვის',
    date: '2026-05-12'
  },
  {
    id: 'm4',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    caption: 'გუნდური მუშაობა ჰაკათონზე ეკოლოგიური პროექტების ირგვლივ',
    date: '2026-05-10'
  },
  {
    id: 'm5',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
    caption: 'ბოქს-დებატების ჟიურის წევრები კონკურსის ფინალზე',
    date: '2026-05-08'
  },
  {
    id: 'm6',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1558224494-ef350acc59c1?auto=format&fit=crop&w=800&q=80',
    caption: 'პოდკასტის პირველი ეპიზოდის ჩაწერა ჩვენს ხმისმწერ მედიალაბში',
    date: '2026-05-05'
  }
];

export const DEFAULT_CUSTOM_QUESTIONS: CustomQuestion[] = [
  {
    id: 'q1',
    label: 'მოკლედ აღწერეთ ოთახით სარგებლობის მიზანი და დაგეგმილი აქტივობა',
    placeholder: 'მაგ: სკოლის მოსწავლეების გუნდის პროექტზე მუშაობა, ტრენინგი...',
    required: true,
    type: 'textarea'
  },
  {
    id: 'q2',
    label: 'გჭირდებათ თუ არა ჰაბის ტექნიკური აღჭურვილობის გამოყენება?',
    placeholder: 'აირჩიეთ პასუხი',
    required: true,
    type: 'select',
    options: ['დიახ, პროექტორი და ხმის სისტემა', 'დიახ, ლეპტოპები და მიკროფონები', 'არა, მხოლოდ სივრცე მჭირდება']
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    roomId: '1',
    roomName: 'მედია და პოდკასტ ლაბორატორია',
    date: '2026-05-24',
    durationHours: '14:00 - 16:00',
    numPeople: 4,
    totalPrice: 30, // 2 hours x 15 GEL
    firstName: 'გიორგი',
    lastName: 'კალანდარიშვილი',
    organization: 'პორტის ახალგაზრდული ლიგა',
    email: 'yhub.poti@gmail.com', // Using user email or sample
    phone: '599 12 34 56',
    answers: {
      'მოკლედ აღწერეთ ოთახით სარგებლობის მიზანი და დაგეგმილი აქტივობა': 'ახალგაზრდული პოდკასტის „ფოთის ლოკომოტივი“ საპილოტე ეპიზოდის ჩაწერა.',
      'გჭირდებათ თუ არა ჰაბის ტექნიკური აღჭურვილობის გამოყენება?': 'დიახ, ლეპტოპები და მიკროფონები'
    },
    status: 'pending',
    createdAt: '2026-05-21T14:30:00Z'
  },
  {
    id: 'b2',
    roomId: '2',
    roomName: 'კოლაბორაციული Hub / Co-working სივრცე',
    date: '2026-05-25',
    durationHours: '10:00 - 13:00',
    numPeople: 15,
    totalPrice: 90, // 3 hours x 30 GEL
    firstName: 'მარიამ',
    lastName: 'ცხადაია',
    organization: 'კოლხეთის მწვანეები',
    email: 'm.tskhadaia@gmail.com',
    phone: '577 98 76 54',
    answers: {
      'მოკლედ აღწერეთ ოთახით სარგებლობის მიზანი და დაგეგმილი აქტივობა': 'ეკო-აქტივისტების ყოველკვირეული გეგმური შეხვედრაც.',
      'გჭირდებათ თუ არა ჰაბის ტექნიკური აღჭურვილობის გამოყენება?': 'არა, მხოლოდ სივრცე მჭირდება'
    },
    status: 'approved',
    invoiceNumber: 'INV-2026-001',
    createdAt: '2026-05-20T09:15:00Z'
  },
  {
    id: 'b3',
    roomId: '3',
    roomName: 'საპრეზენტაციო და საკონფერენციო დარბაზი',
    date: '2026-05-25',
    durationHours: '15:00 - 18:00',
    numPeople: 40,
    totalPrice: 180, // 3 hours x 60 GEL
    firstName: 'ნიკოლოზ',
    lastName: 'სანიკიძე',
    organization: 'ფოთის მუნიციპალიტეტის საკრებულო',
    email: 'n.sanikidze@poti.gov.ge',
    phone: '595 11 22 33',
    answers: {
      'მოკლედ აღწერეთ ოთახით სარგებლობის მიზანი და დაგეგმილი აქტივობა': 'ახალგაზრდული საბჭოს საჯარო მოსმენა და რეგიონული პრიორიტეტების განხილვა.',
      'გჭირდებათ თუ არა ჰაბის ტექნიკური აღჭურვილობის გამოყენება?': 'დიახ, პროექტორი და ხმის სისტემა'
    },
    status: 'pending',
    createdAt: '2026-05-22T08:00:00Z'
  }
];
