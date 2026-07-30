import z from 'zod';

export const assistantFormSchema = z.object({
  destination: z.string(),
  activity: z.array(z.string()),
  comfort: z.string(),
  transportation: z.array(z.string()),
  accomodationType: z.array(z.string()),
  luggageConstraints: z.string(),
  laundryAccess: z.string(),
  dateFrom: z.string(),
  dateUntil: z.string(),
  nbPersons: z.string(),
  remarks: z.string(),
});

export const assistantPackingListSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          note: z.string().optional(),
        }),
      ),
    }),
  ),
});
