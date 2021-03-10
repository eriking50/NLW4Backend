import { resolve } from 'path'
import { Request, Response } from "express"
import { getCustomRepository } from "typeorm"
import { SurveyRepository } from "../repositories/SurveysRepository"
import { SurveyUsersRepository } from "../repositories/SurveysUsersRepository"
import { UsersRepository } from "../repositories/UsersRepository"
import SendMailService from "../services/SendMailService"

class SendMailController {
    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body

        const usersRepository = getCustomRepository(UsersRepository)
        const surveyRepository = getCustomRepository(SurveyRepository)
        const surveysUsersRepository = getCustomRepository(SurveyUsersRepository)

        const user = await usersRepository.findOne({email})

        if(!user) {
            return response.status(400).json({
                error: "User não existe"
            })
        }

        const survey = await surveyRepository.findOne({id: survey_id})

        if(!survey) {
            return response.status(400).json({
                error: "Pesquisa não existe"
            })
        }

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs")
        
        
        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations: ["user", "survery"]
        })
        
        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL
        }

        if(surveyUserAlreadyExists) {
            variables.id = surveyUserAlreadyExists.id
            await SendMailService.execute(email, survey.title, variables, npsPath)
            return response.json(surveyUserAlreadyExists)
        }

        //Salvar informação na tabela surveyUser
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id
        })
        
        await surveysUsersRepository.save(surveyUser)
        //Enviar email para Usar
        variables.id = surveyUser.id
        
        await SendMailService.execute(email, survey.title, variables, npsPath )

        return response.json(surveyUser)


    }
}

export { SendMailController }